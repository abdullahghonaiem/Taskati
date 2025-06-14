import { supabase } from '../supabase';

interface SubscriptionDetails {
  userId: string;
  subscriptionId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'pending';
}

/**
 * Updates or creates a user's subscription plan record
 */
export const updateUserSubscription = async (
  userId: string,
  subscriptionId: string,
  planId: string,
  status: 'active' | 'pending' = 'pending'
): Promise<boolean> => {
  try {
    if (!userId || !subscriptionId || !planId) {
      console.error('Missing required parameters for updating subscription');
      return false;
    }

    console.log(`Updating subscription for user ${userId}: ${subscriptionId} (${planId}) - ${status}`);

    // Try to insert a new record, or update if it already exists (upsert)
    const { error } = await supabase.from('user_plans').upsert({
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: planId,
      status,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error updating user subscription:', error);
      return false;
    }

    console.log('Subscription updated successfully');
    return true;
  } catch (err) {
    console.error('Error in updateUserSubscription:', err);
    return false;
  }
};

/**
 * Gets the current subscription plan for a user
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionDetails | null> => {
  try {
    if (!userId) {
      console.error('Missing userId for getUserSubscription');
      return null;
    }

    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return null;
      }
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) return null;

    return {
      userId: data.user_id,
      subscriptionId: data.subscription_id,
      planId: data.plan_id,
      status: data.status as 'active' | 'cancelled' | 'pending',
    };
  } catch (err) {
    console.error('Error in getUserSubscription:', err);
    return null;
  }
};

/**
 * Checks if a user has an active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    return subscription !== null && subscription.status === 'active';
  } catch (err) {
    console.error('Error checking active subscription:', err);
    return false;
  }
}; 