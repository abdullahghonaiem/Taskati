# PayPal Subscription Integration Setup

This document provides instructions for setting up PayPal subscription integration with your Kanban application.

## Prerequisites

1. PayPal Business Account
2. Supabase project with Edge Functions enabled

## Setup Steps

### 1. PayPal Setup

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create a new app in the PayPal Developer Dashboard to get your Client ID and Secret
3. Set up your subscription plans:
   - Go to Products & Plans in the PayPal Dashboard
   - Create products for each tier (Basic, Pro, Premium)
   - Create subscription plans for each product
   - Note down the Plan IDs for each subscription plan

### 2. Database Setup

1. Run the `setup-user-plans-table.sql` script in your Supabase SQL editor:
   ```sql
   -- This creates the user_plans table with appropriate RLS policies
   ```

### 3. Supabase Edge Function Setup

1. Make sure you have the Supabase CLI installed and configured
2. Deploy the PayPal webhook function:
   ```bash
   cd /path/to/project
   supabase functions deploy paypal-webhook
   ```
3. Set the required environment variables for the Edge Function:
   ```bash
   supabase secrets set PAYPAL_WEBHOOK_SECRET=your_webhook_secret
   ```

### 4. PayPal Webhook Configuration

1. Go to the PayPal Developer Dashboard > Your App > Webhooks
2. Add a new webhook with the URL of your deployed Supabase Edge Function:
   ```
   https://[your-supabase-project].functions.supabase.co/paypal-webhook
   ```
3. Enable the following webhook events:
   - BILLING.SUBSCRIPTION.ACTIVATED
   - BILLING.SUBSCRIPTION.CANCELLED
   - BILLING.SUBSCRIPTION.SUSPENDED
   - BILLING.SUBSCRIPTION.PAYMENT.FAILED
   - BILLING.SUBSCRIPTION.RENEWED
   - BILLING.SUBSCRIPTION.CREATED

### 5. Update Application Configuration

1. In `src/components/settings/SettingsPage.tsx`, update the `PAYPAL_CLIENT_ID` constant with your PayPal app client ID.
2. In `SUBSCRIPTION_PLANS`, update the `paypalPlanId` values with your actual PayPal plan IDs.

## Testing the Integration

1. Run your application in development mode:
   ```bash
   npm run dev
   ```
2. Log in to your application
3. Navigate to the Settings page
4. Select a subscription plan
5. Complete the PayPal checkout process using a sandbox account
6. Verify that the subscription status is updated correctly in your application

## Subscription Lifecycle

1. When a user initiates a subscription:
   - They're redirected to PayPal to complete payment
   - On approval, the subscription is created in PayPal and recorded in your database with status "pending"

2. PayPal then sends webhook events to your Edge Function:
   - When the subscription is activated, the status is updated to "active"
   - If the subscription is cancelled, the status is updated to "cancelled"

3. Users can view their subscription status in the Settings page

## Troubleshooting

- Check the Edge Function logs in the Supabase dashboard for any errors
- Verify webhook delivery in the PayPal Developer Dashboard
- Ensure your PayPal app is in the correct mode (Sandbox for testing, Live for production)

## Production Deployment

For production deployment:

1. Create a separate PayPal app in Live mode
2. Update the client ID and plan IDs in your application
3. Update the webhook URL to point to your production Supabase Edge Function
4. Test the integration with a real PayPal account 