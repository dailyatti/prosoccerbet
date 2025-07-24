import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Get the body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Processing Stripe webhook:', event.type);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, stripe, event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the webhook event
    await supabase
      .from('stripe_webhooks')
      .insert({
        event_id: event.id,
        event_type: event.type,
        processed: true,
        data: event.data
      });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  // Find user by customer ID
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  if (userError || !users?.length) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const user = users[0];
  
  // Update user subscription status
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_active: status === 'active',
      subscription_expires_at: currentPeriodEnd.toISOString(),
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error updating user subscription:', updateError);
    throw updateError;
  }

  console.log(`Updated subscription for user ${user.id}: ${status}`);
}

async function handleSubscriptionCancellation(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by customer ID
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .limit(1);

  if (userError || !users?.length) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const user = users[0];
  
  // Update user subscription status
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_active: false,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error canceling user subscription:', updateError);
    throw updateError;
  }

  console.log(`Canceled subscription for user ${user.id}`);
}

async function handlePaymentSuccess(supabase: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;
  
  // Update last payment date
  const { error } = await supabase
    .from('users')
    .update({
      last_payment_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating payment date:', error);
  }

  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // You might want to send an email notification or update user status
  console.log(`Payment failed for customer ${customerId}`);
  
  // Log the failed payment
  await supabase
    .from('payment_failures')
    .insert({
      customer_id: customerId,
      invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      failure_reason: invoice.last_finalization_error?.message || 'Unknown',
      created_at: new Date().toISOString()
    });
}

async function handleCheckoutCompleted(supabase: any, stripe: Stripe, session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email;
  const subscriptionId = session.subscription as string;
  
  if (!customerId || !customerEmail) return;
  
  // Find or create user
  let { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', customerEmail)
    .limit(1);

  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }

  let user = users?.[0];
  
  if (!user) {
    // Create new user if doesn't exist
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: customerEmail,
        stripe_customer_id: customerId,
        subscription_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    
    user = newUser;
  } else {
    // Update existing user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: customerId,
        subscription_active: true,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }
  }

  console.log(`Checkout completed for user ${user.id}`);
}