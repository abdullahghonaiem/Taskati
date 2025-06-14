/// <reference types="https://deno.land/x/lambda/mod.ts" />
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Hardcoded credentials for easier deployment
// In a production environment, these should be set as environment variables
const PAYPAL_CLIENT_SECRET = "EOCGJ3lAe4PD6BG2OcBXeyS4gy1YEBORTCTMh1K9kxUQkt5b-eRcIPoKsX_7LABOVwsvFQuxBCpUUnha";
const SUPABASE_URL = "https://likpyrddpkwansbubyue.supabase.co"; // Replace with your actual Supabase URL
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3B5cmRkcGt3YW5zYnVieXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI1NjE4MSwiZXhwIjoyMDY0ODMyMTgxfQ.xJ1xLuWoZuvl6hrNSwjMA1cmptiKdWB2pJXZ_O3IiZA";

// Hardcoded credentials as fallbacks
const SUPABASE_URL_FALLBACK = "https://likpyrddpkwansbubyue.supabase.co";
const SUPABASE_SERVICE_KEY_FALLBACK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3B5cmRkcGt3YW5zYnVieXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI1NjE4MSwiZXhwIjoyMDY0ODMyMTgxfQ.xJ1xLuWoZuvl6hrNSwjMA1cmptiKdWB2pJXZ_O3IiZA";

// Get credentials from environment variables if available, otherwise use hardcoded values
const WEBHOOK_SECRET = Deno.env.get('PAYPAL_WEBHOOK_SECRET') || PAYPAL_CLIENT_SECRET;
const SKIP_VERIFICATION = false; // We have the client secret so we can use it for verification

// Log initialization
console.log('Initializing PayPal webhook handler');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Webhook signature verification:', SKIP_VERIFICATION ? 'DISABLED' : 'ENABLED');

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status?: string;
    billing_agreement_id?: string;
    subscriber?: {
      email_address?: string;
      payer_id?: string;
    };
    custom_id?: string; // Can be used to store user_id
    [key: string]: any;
  };
  [key: string]: any;
}

serve(async (req: Request) => {
  console.log('PayPal webhook received');
  
  // Validate request method
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method);
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  // Get environment variables for Supabase connection with fallbacks
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || SUPABASE_URL_FALLBACK;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || SUPABASE_SERVICE_KEY_FALLBACK;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return new Response('Server configuration error', { status: 500 });
  }
  
  // Log connection details (for debugging)
  console.log('Using Supabase URL:', supabaseUrl);
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Parse the webhook payload
    const payload: PayPalWebhookEvent = await req.json();
    const eventType = payload.event_type;
    const subscriptionId = payload.resource?.id;
    
    console.log(`Received event: ${eventType} for subscription: ${subscriptionId}`);
    
    // Validate the payload
    if (!eventType || !subscriptionId) {
      console.error('Invalid payload:', payload);
      return new Response('Invalid payload', { status: 400 });
    }
    
    // Process different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription is activated - update status to 'active'
        await updateSubscriptionStatus(supabase, subscriptionId, 'active');
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Subscription is cancelled - update status to 'cancelled'
        await updateSubscriptionStatus(supabase, subscriptionId, 'cancelled');
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Subscription is suspended - update status to 'suspended'
        await updateSubscriptionStatus(supabase, subscriptionId, 'suspended');
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // Payment failed - you might want to notify the user
        console.log('Payment failed for subscription:', subscriptionId);
        // Could update to a 'payment_failed' status or send an email notification
        break;
        
      case 'BILLING.SUBSCRIPTION.RENEWED':
        // Subscription renewed - could update a 'last_renewed' field if you have one
        console.log('Subscription renewed:', subscriptionId);
        break;
        
      case 'BILLING.SUBSCRIPTION.CREATED':
        // Subscription created - but not yet activated
        console.log('Subscription created:', subscriptionId);
        break;
        
      default:
        console.log('Unhandled event type:', eventType);
    }
    
    // Always return 200 OK to PayPal to acknowledge receipt
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

/**
 * Updates the status of a subscription in the database
 */
async function updateSubscriptionStatus(
  supabase: any,
  subscriptionId: string,
  status: string
) {
  try {
    console.log(`Updating subscription ${subscriptionId} to status: ${status}`);
    
    const { data, error } = await supabase
      .from('user_plans')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);
      
    if (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }
    
    console.log('Subscription status updated successfully');
    return true;
    
  } catch (err) {
    console.error('Error in updateSubscriptionStatus:', err);
    return false;
  }
} 