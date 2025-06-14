// Application configuration

// PayPal Development Mode Settings
// When enabled, users can subscribe to plans without making real PayPal payments
// This makes testing easier by using simulated subscriptions
export const ENABLE_DEV_SUBSCRIPTION_MODE = true;

// PayPal API Credentials
// Replace with your production credentials for real payments
export const PAYPAL_CLIENT_ID = "ATlrGI0NcpaoFh7cdkFE-q14Xxw17np8TfnHXJu-4T-GP-8o3t7B1Is86rrG1Dp92D5l9HvI5nkP4S2_";

// Subscription Plan Task Limits
// These values define how many active tasks a user can have based on their subscription
export const FREE_PLAN_TASK_LIMIT = 5;  // Default limit for users without a paid subscription

// Plan IDs and their corresponding task limits
// The keys are PayPal plan IDs that must match the ones in your PayPal dashboard
export const SUBSCRIPTION_PLAN_LIMITS: Record<string, number> = {
  'P-90N57053P66221623NBETAGI': 10, // Basic Plan ($5/month)
  'P-4U238456CC281673FNBETEFI': 25, // Pro Plan ($12/month)
  'P-18M969130R0964230NBETENQ': 50  // Premium Plan ($25/month)
}; 