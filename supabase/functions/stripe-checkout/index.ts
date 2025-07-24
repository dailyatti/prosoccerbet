import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize services
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

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

    // Get request data
    const { price_id, mode = 'subscription', success_url, cancel_url } = await req.json();

    if (!price_id) {
      throw new Error('Price ID is required');
    }

    // Get user data from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('User not found in database');
    }

    // Create or get Stripe customer
    let customerId = userData.stripe_customer_id;
    
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: userData.email,
          name: userData.full_name || undefined,
          metadata: {
            supabase_user_id: user.id,
            created_via: 'prosofthub_checkout'
          },
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user with customer ID:', updateError);
        }

        // Insert customer record
        await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            email: userData.email,
            name: userData.full_name
          });

      } catch (customerError) {
        console.error('Error creating Stripe customer:', customerError);
        throw new Error('Failed to create customer account');
      }
    }

    // Determine origin for URLs
    const origin = req.headers.get('origin') || 'https://prosofthub.com';

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      success_url: success_url || `${origin}/#success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${origin}/#dashboard`,
      metadata: {
        user_id: user.id,
        created_via: 'prosofthub_checkout'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      tax_id_collection: {
        enabled: true
      }
    };

    // Add subscription-specific settings
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        trial_period_days: 0, // We handle trials in our application
        metadata: {
          user_id: user.id,
          supabase_user_id: user.id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log checkout session creation
    console.log(`Created checkout session ${session.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});