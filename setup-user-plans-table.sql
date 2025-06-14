-- Create user_plans table to store subscription information
CREATE TABLE user_plans (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Create RLS policies for the user_plans table
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own subscription data
CREATE POLICY "Users can view their own subscription data" 
  ON user_plans FOR SELECT 
  USING (auth.uid() = user_id);

-- Only allow service role or server to update subscription data
CREATE POLICY "Only service role can insert/update subscription data" 
  ON user_plans FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Create index for faster lookups by subscription_id
CREATE INDEX idx_user_plans_subscription_id ON user_plans (subscription_id);

-- Add comments for documentation
COMMENT ON TABLE user_plans IS 'Stores PayPal subscription information for users';
COMMENT ON COLUMN user_plans.user_id IS 'User ID from auth.users table';
COMMENT ON COLUMN user_plans.subscription_id IS 'PayPal subscription ID';
COMMENT ON COLUMN user_plans.plan_id IS 'PayPal plan ID';
COMMENT ON COLUMN user_plans.status IS 'Subscription status: pending, active, or cancelled'; 