import { supabase } from '../supabase';
import { markOnboardingCompleted } from './onboardingService';

/**
 * Sign up a new user without email confirmation
 * 
 * This function will:
 * 1. Create a new user account
 * 2. Try to immediately sign in
 * 3. Set up initial user settings
 */
export const signUpWithoutConfirmation = async (
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string; }> => {
  try {
    console.log('Attempting to sign up user without email confirmation:', email);
    
    // Step 1: Create the user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          completed_onboarding: false,
        },
      },
    });
    
    if (signUpError) {
      console.error('Error during signup:', signUpError);
      return { 
        success: false, 
        error: signUpError.message 
      };
    }
    
    if (!signUpData.user) {
      console.error('No user data returned from signup');
      return { 
        success: false, 
        error: 'Failed to create user account' 
      };
    }
    
    console.log('User created successfully:', signUpData.user.id);
    
    // Step 1.5: IMPORTANT - Directly run SQL to confirm the user's email
    // This bypasses Supabase's email confirmation requirement
    try {
      // First attempt: update auth.users table directly
      const { error: confirmError } = await supabase.rpc('confirm_user_email', { 
        user_id: signUpData.user.id 
      });
      
      if (confirmError) {
        console.error('Error confirming user email via RPC:', confirmError);
        
        // Second attempt: update via auth schema
        try {
          const { error: authUpdateError } = await supabase
            .from('auth.users')
            .update({ email_confirmed_at: new Date().toISOString() })
            .eq('id', signUpData.user.id);
            
          if (authUpdateError) {
            console.error('Error confirming user email via auth schema:', authUpdateError);
            
            // Third attempt: update via regular table
            try {
              const { error: usersUpdateError } = await supabase
                .from('users')
                .update({ email_confirmed_at: new Date().toISOString() })
                .eq('id', signUpData.user.id);
                
              if (usersUpdateError) {
                console.error('Error confirming user email via users table:', usersUpdateError);
              } else {
                console.log('User email confirmed via users table');
              }
            } catch (err) {
              console.error('Error updating users table:', err);
            }
          } else {
            console.log('User email confirmed via auth schema');
          }
        } catch (err) {
          console.error('Error updating auth schema:', err);
        }
      } else {
        console.log('User email confirmed via RPC function');
      }
    } catch (err) {
      console.error('Error confirming user email:', err);
    }
    
    // Step 2: Always try to sign in after signup, regardless of session status
    console.log('Attempting direct sign in');
    
    // Wait a moment to allow the database updates to take effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('Error signing in after signup:', signInError);
      
      // Try signing in with OTP as a last resort
      try {
        console.log('Trying OTP login as fallback');
        await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          }
        });
        console.log('OTP sent to user email');
        
        return { 
          success: true, 
          error: 'We\'ve sent a login link to your email. Please check your inbox.' 
        };
      } catch (otpErr) {
        console.error('Error sending OTP:', otpErr);
        return { 
          success: false, 
          error: 'Account created but unable to sign in automatically. Please check your email for a confirmation link or try signing in manually.' 
        };
      }
    } else {
      console.log('Direct sign in successful');
      
      // Step 3: Set up initial user settings (bypass normal onboarding)
      try {
        await markOnboardingCompleted(signUpData.user.id);
        console.log('Initial user settings created');
      } catch (err) {
        console.error('Error creating initial user settings:', err);
        // Don't fail the whole process if just this part fails
      }
      
      return { success: true };
    }
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    };
  }
}; 