import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Get comprehensive subscription status using our database function
    const { data: statusData, error: statusError } = await supabase
      .rpc('get_user_subscription_status', { p_user_id: user.id });

    if (statusError) {
      console.error('Error getting subscription status:', statusError);
      throw new Error('Failed to retrieve subscription status');
    }

    // Get additional user data
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        stripe_customer_id,
        subscription_active,
        subscription_expires_at,
        trial_expires_at,
        is_trial_used,
        subscription_tier,
        created_at
      `)
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('Error getting user data:', userDataError);
      throw new Error('Failed to retrieve user data');
    }

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (statusData.type === 'stripe_subscription' && statusData.subscription_id) {
      const { data: subData, error: subError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', statusData.subscription_id)
        .single();

      if (!subError && subData) {
        stripeSubscription = subData;
      }
    }

    // Prepare comprehensive response
    const response = {
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at
      },
      subscription: {
        status: statusData.status,
        type: statusData.type,
        has_access: statusData.has_access,
        tier: statusData.tier || 'free',
        expires_at: statusData.expires_at,
        cancel_at_period_end: statusData.cancel_at_period_end || false
      },
      stripe: stripeSubscription ? {
        customer_id: stripeSubscription.stripe_customer_id,
        subscription_id: stripeSubscription.stripe_subscription_id,
        price_id: stripeSubscription.stripe_price_id,
        status: stripeSubscription.status,
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      } : null,
      trial: {
        expires_at: userData.trial_expires_at,
        is_used: userData.is_trial_used,
        has_access: statusData.type === 'trial' && statusData.has_access
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Subscription status error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to get subscription status'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});