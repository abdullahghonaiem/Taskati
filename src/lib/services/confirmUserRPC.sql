-- Create function to directly confirm a user's email
-- This needs to be executed in the Supabase SQL editor
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the auth.users table to mark the email as confirmed
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW(),
      last_sign_in_at = NOW(),
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission to the anon role
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(UUID) TO service_role; 