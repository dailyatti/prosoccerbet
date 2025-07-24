import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new Error('Invalid signature');
    }

    console.log('Processing webhook event:', event.type);

    // Log webhook event
    await supabase
      .from('stripe_webhooks')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event.data,
        processed: false
      });

    // Process the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionEvent(supabase, subscription, 'created');
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(supabase, subscription, 'updated');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(supabase, subscription, 'deleted');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionEvent(supabase, subscription, 'payment_succeeded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionEvent(supabase, subscription, 'payment_failed');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await supabase
      .from('stripe_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handleSubscriptionEvent(
  supabase: any,
  subscription: Stripe.Subscription,
  eventType: string
) {
  try {
    // Find user by customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !userData) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    const isActive = subscription.status === 'active';
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);

    // Use the sync function from migration
    const { error: syncError } = await supabase
      .rpc('sync_stripe_subscription', {
        p_user_id: userData.id,
        p_stripe_customer_id: subscription.customer,
        p_stripe_subscription_id: subscription.id,
        p_status: subscription.status,
        p_current_period_start: currentPeriodStart.toISOString(),
        p_current_period_end: currentPeriodEnd.toISOString(),
        p_cancel_at_period_end: subscription.cancel_at_period_end || false
      });

    if (syncError) {
      console.error('Error syncing subscription:', syncError);
      throw syncError;
    }

    console.log(`Successfully processed ${eventType} for user ${userData.id}`);
    
  } catch (error) {
    console.error('Error handling subscription event:', error);
    throw error;
  }
}