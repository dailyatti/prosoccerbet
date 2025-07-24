import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Initialize services
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get request body and signature
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
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`Processing webhook: ${event.type} (${event.id})`);

    // Log webhook event for monitoring
    try {
      await supabase
        .from('stripe_webhooks')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          data: event.data,
          processed: false
        });
    } catch (logError) {
      console.error('Error logging webhook:', logError);
      // Continue processing even if logging fails
    }

    // Process the event
    let processed = false;
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionUpdate(supabase, stripe, subscription, 'checkout_completed');
          processed = true;
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, stripe, subscription, event.type);
        processed = true;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(supabase, stripe, subscription);
        processed = true;
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionUpdate(supabase, stripe, subscription, 'payment_succeeded');
          await handleInvoice(supabase, invoice, 'paid');
          processed = true;
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoice(supabase, invoice, 'payment_failed');
          processed = true;
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        processed = true; // Mark as processed even if we don't handle it
    }

    // Update webhook status
    try {
      await supabase
        .from('stripe_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id);
    } catch (updateError) {
      console.error('Error updating webhook status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        processed,
        event_type: event.type 
      }),
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
        error: error.message || 'Webhook processing failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Handle subscription creation/update events
 */
async function handleSubscriptionUpdate(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventType: string
) {
  try {
    console.log(`Processing subscription ${subscription.id} for customer ${subscription.customer}`);

    // Find user by Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (userError || !userData) {
      console.error('User not found for customer:', subscription.customer, userError);
      throw new Error(`User not found for customer ${subscription.customer}`);
    }

    // Prepare subscription data
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    const priceId = subscription.items.data[0]?.price?.id || null;

    // Use the database function to sync subscription
    const { error: syncError } = await supabase
      .rpc('sync_stripe_subscription', {
        p_user_id: userData.id,
        p_stripe_customer_id: subscription.customer as string,
        p_stripe_subscription_id: subscription.id,
        p_stripe_price_id: priceId,
        p_status: subscription.status,
        p_current_period_start: currentPeriodStart.toISOString(),
        p_current_period_end: currentPeriodEnd.toISOString(),
        p_cancel_at_period_end: subscription.cancel_at_period_end || false,
        p_canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
      });

    if (syncError) {
      console.error('Error syncing subscription:', syncError);
      throw syncError;
    }

    console.log(`Successfully processed ${eventType} for user ${userData.id}, subscription ${subscription.id}`);
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(
  supabase: any,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  try {
    console.log(`Processing cancellation for subscription ${subscription.id}`);

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

    // Update user subscription status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_active: false,
        subscription_expires_at: null,
        subscription_tier: 'free'
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      throw updateError;
    }

    // Update subscription record
    const { error: subUpdateError } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subUpdateError) {
      console.error('Error updating subscription record:', subUpdateError);
    }

    console.log(`Successfully processed cancellation for user ${userData.id}`);
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

/**
 * Handle invoice events
 */
async function handleInvoice(
  supabase: any,
  invoice: Stripe.Invoice,
  eventType: string
) {
  try {
    console.log(`Processing invoice ${invoice.id} - ${eventType}`);

    // Find user by customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', invoice.customer)
      .single();

    if (userError || !userData) {
      console.error('User not found for invoice customer:', invoice.customer);
      return;
    }

    // Insert or update invoice record
    const invoiceData = {
      user_id: userData.id,
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      stripe_subscription_id: invoice.subscription as string || null,
      amount_paid: invoice.amount_paid || 0,
      amount_due: invoice.amount_due || 0,
      amount_remaining: invoice.amount_remaining || 0,
      currency: invoice.currency,
      status: invoice.status || 'unknown',
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      number: invoice.number || null,
      paid_at: invoice.status === 'paid' && invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000) 
        : null
    };

    const { error: invoiceError } = await supabase
      .from('stripe_invoices')
      .upsert(invoiceData, { 
        onConflict: 'stripe_invoice_id',
        ignoreDuplicates: false 
      });

    if (invoiceError) {
      console.error('Error upserting invoice:', invoiceError);
      throw invoiceError;
    }

    console.log(`Successfully processed invoice ${invoice.id} for user ${userData.id}`);
    
  } catch (error) {
    console.error('Error handling invoice:', error);
    throw error;
  }
}