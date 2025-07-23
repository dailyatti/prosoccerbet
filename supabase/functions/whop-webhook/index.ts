import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'npm:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WhopWebhookPayload {
  type: string;
  data: {
    id: string;
    user: {
      id: string;
      email: string;
    };
    product: {
      id: string;
    };
    status: string;
    current_period_start?: number;
    current_period_end?: number;
    created_at: number;
  };
}

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
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
    const whopSecret = Deno.env.get('WHOP_WEBHOOK_SECRET');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook signature for verification
    const signature = req.headers.get('x-whop-signature');
    const body = await req.text();
    
    // Verify signature if secret is provided
    if (whopSecret && signature) {
      if (!verifySignature(body, signature, whopSecret)) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid signature' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }
    }
    
    // Parse webhook payload
    let webhookData: WhopWebhookPayload;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid JSON payload');
    }

    // Validate required fields
    if (!webhookData.type || !webhookData.data || !webhookData.data.user) {
      throw new Error('Missing required webhook fields');
    }
    
    // Store raw webhook data
    const { error: webhookError } = await supabase
      .from('whop_webhooks')
      .insert({
        webhook_type: webhookData.type,
        webhook_data: webhookData,
        whop_user_id: webhookData.data.user.id,
        signature: signature,
        processed: false
      });

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
    }

    // Process different webhook types
    let processed = false;
    let errorMessage = null;

    try {
      switch (webhookData.type) {
        case 'payment.completed':
        case 'subscription.created':
        case 'subscription.updated':
          await handleSubscriptionEvent(supabase, webhookData);
          processed = true;
          break;
          
        case 'subscription.cancelled':
        case 'subscription.expired':
          await handleSubscriptionCancellation(supabase, webhookData);
          processed = true;
          break;
          
        default:
          console.log(`Unhandled webhook type: ${webhookData.type}`);
          processed = true; // Mark as processed even if we don't handle it
      }
    } catch (error) {
      errorMessage = error.message;
      console.error('Error processing webhook:', error);
    }

    // Update webhook processing status
    if (!webhookError) {
      await supabase
        .from('whop_webhooks')
        .update({
          processed: processed,
          processed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('whop_user_id', webhookData.data.user.id)
        .eq('webhook_type', webhookData.type)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    // Log sync operation
    await supabase
      .from('whop_sync_logs')
      .insert({
        sync_type: 'webhook',
        status: processed && !errorMessage ? 'success' : 'error',
        users_processed: processed ? 1 : 0,
        errors_count: errorMessage ? 1 : 0,
        details: {
          webhook_type: webhookData.type,
          whop_user_id: webhookData.data.user.id,
          error: errorMessage
        }
      });

    return new Response(
      JSON.stringify({ 
        success: processed,
        message: errorMessage || 'Webhook processed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: processed ? 200 : 500,
      },
    );

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

async function handleSubscriptionEvent(supabase: any, webhookData: WhopWebhookPayload) {
  const { data, user } = webhookData.data;
  
  // Call the sync function
  const { error } = await supabase.rpc('sync_user_subscription', {
    p_whop_user_id: user.id,
    p_email: user.email,
    p_subscription_status: data.status,
    p_plan_id: data.product.id,
    p_start_date: data.current_period_start ? new Date(data.current_period_start * 1000).toISOString() : null,
    p_end_date: data.current_period_end ? new Date(data.current_period_end * 1000).toISOString() : null
  });
  
  if (error) {
    throw new Error(`Failed to sync subscription: ${error.message}`);
  }
}

async function handleSubscriptionCancellation(supabase: any, webhookData: WhopWebhookPayload) {
  const { user } = webhookData.data;
  
  // Call the sync function with inactive status
  const { error } = await supabase.rpc('sync_user_subscription', {
    p_whop_user_id: user.id,
    p_email: user.email,
    p_subscription_status: 'cancelled'
  });
  
  if (error) {
    throw new Error(`Failed to sync cancellation: ${error.message}`);
  }
}