import { supabase } from '../supabase';

// Check if the user has completed onboarding
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
  try {
    console.log('Checking if user has completed onboarding:', userId);
    
    // First try to get the user's metadata from auth
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (!userError && userData?.user && userData.user.id === userId) {
        console.log('User metadata check:', userData.user.user_metadata);
        if (userData.user.user_metadata?.completed_onboarding === true) {
          console.log('User has completed onboarding based on metadata');
          return true;
        }
      }
    } catch (err) {
      console.error('Error checking user metadata:', err);
      // Continue to check the user_settings table as fallback
    }

    // If not in metadata, check the user_settings table as fallback
    console.log('Checking user_settings table as fallback');
    const { data, error } = await supabase
      .from('user_settings')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error checking onboarding status in database:', error);
      return false;
    }
    
    // If no data exists yet, the user hasn't completed onboarding
    if (!data) {
      console.log('No user settings found in database, user has not completed onboarding');
      return false;
    }
    
    console.log('User onboarding status from database:', data.onboarding_completed);
    return data.onboarding_completed === true;
  } catch (err) {
    console.error('Error in hasCompletedOnboarding:', err);
    return false;
  }
};

// Mark onboarding as completed for a user
export const markOnboardingCompleted = async (userId: string): Promise<boolean> => {
  try {
    console.log('Marking onboarding as completed for user:', userId);
    
    // Create/update the record in user_settings table
    let success = true;
    
    // First check if the user has a settings record
    const { data, error } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking user settings:', error);
      success = false;
    }
    
    if (data) {
      console.log('Updating existing user settings record');
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ onboarding_completed: true })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating onboarding status:', updateError);
        success = false;
      }
    } else {
      console.log('Creating new user settings record');
      // Create new settings record
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          onboarding_completed: true,
          // Add any other default settings here
        });
        
      if (insertError) {
        console.error('Error creating user settings:', insertError);
        success = false;
      }
    }
    
    // Also update the user metadata for faster access
    try {
      console.log('Updating user metadata');
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { completed_onboarding: true }
      });
      
      if (updateUserError) {
        console.error('Error updating user metadata:', updateUserError);
      } else {
        console.log('User metadata updated successfully');
      }
    } catch (err) {
      console.error('Error updating user metadata:', err);
      // Don't fail the whole operation if just metadata update fails
    }
    
    return success;
  } catch (err) {
    console.error('Error in markOnboardingCompleted:', err);
    return false;
  }
};

// If we need to reset onboarding for testing
export const resetOnboarding = async (userId: string): Promise<boolean> => {
  try {
    console.log('Resetting onboarding for user:', userId);
    
    const { error } = await supabase
      .from('user_settings')
      .update({ onboarding_completed: false })
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error resetting onboarding status:', error);
      return false;
    }
    
    // Also update the user metadata
    try {
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { completed_onboarding: false }
      });
      
      if (updateUserError) {
        console.error('Error updating user metadata:', updateUserError);
      } else {
        console.log('User metadata reset successfully');
      }
    } catch (err) {
      console.error('Error updating user metadata:', err);
    }
    
    return true;
  } catch (err) {
    console.error('Error in resetOnboarding:', err);
    return false;
  }
}; 