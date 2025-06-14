import React, { useState, useEffect } from "react";
import type { User } from '@supabase/supabase-js';
import { supabase } from "../../lib/supabase";
import { updateUserSubscription, getUserSubscription } from "../../lib/services/subscriptionService";
import { getUserTaskLimit } from "../../lib/services/taskService";
import PayPalSubscribeButton from "../PayPalSubscribeButton";
import { ENABLE_DEV_SUBSCRIPTION_MODE, PAYPAL_CLIENT_ID, FREE_PLAN_TASK_LIMIT } from "../../lib/config";

// Import default avatar placeholder
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

// Subscription plans configuration
const SUBSCRIPTION_PLANS = [
  {
    id: 1,
    name: "Basic Plan",
    description: "For personal use",
    price: "$5",
    period: "/month",
    paypalPlanId: "P-90N57053P66221623NBETAGI", // Basic Plan ID
    features: [
      "10 active tasks",
      "Basic AI assistance",
      "Task reminders"
    ],
    taskLimit: 10,
    popular: false
  },
  {
    id: 2,
    name: "Pro Plan",
    description: "For professionals",
    price: "$12",
    period: "/month",
    paypalPlanId: "P-4U238456CC281673FNBETEFI", // Pro Plan ID
    features: [
      "25 active tasks",
      "Advanced AI assistance",
      "Priority support"
    ],
    taskLimit: 25,
    popular: true
  },
  {
    id: 3,
    name: "Premium Plan",
    description: "For teams",
    price: "$25",
    period: "/month",
    paypalPlanId: "P-18M969130R0964230NBETENQ", // Premium Plan ID
    features: [
      "50 active tasks",
      "Premium AI features",
      "Team collaboration"
    ],
    taskLimit: 50,
    popular: false
  }
];

// Add a development mode subscription function
const activateDevSubscription = async (user: User, planId: string): Promise<boolean> => {
  if (!ENABLE_DEV_SUBSCRIPTION_MODE) return false;
  
  try {
    // Generate a fake subscription ID for development
    const fakeSubscriptionId = `dev-sub-${Date.now()}`;
    
    // Update user's subscription in the database
    const success = await updateUserSubscription(
      user.id,
      fakeSubscriptionId,
      planId,
      'active' // Set to active immediately in dev mode
    );
    
    return success;
  } catch (error) {
    console.error('Error activating dev subscription:', error);
    return false;
  }
};

interface SettingsPageProps {
  user: User | null;
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const [activeTaskCount, setActiveTaskCount] = useState(0); // Will be populated from the database
  const [currentTaskLimit, setCurrentTaskLimit] = useState(FREE_PLAN_TASK_LIMIT); // Default to free plan limit
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'success' | 'error' | null>(null);
  const [userSubscription, setUserSubscription] = useState<{
    planId: string;
    status: string;
    subscriptionId: string;
  } | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState<boolean>(ENABLE_DEV_SUBSCRIPTION_MODE);
  
  // Toggle function for dev mode
  const toggleDevMode = () => {
    // In a real app, this would update the config
    // For now we just toggle the local state
    setDevModeEnabled(!devModeEnabled);
  };
  
  // Generate profile avatar from user's initials if no custom avatar
  const getInitials = () => {
    if (!user) return "?";
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
    return name.charAt(0).toUpperCase();
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setAvatarError(false);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;
      
      // Upload the file to supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      setAvatar(data.publicUrl);
      
      // Update user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError(true);
    } finally {
      setUploading(false);
    }
  };
  
  // Handle image load error
  const handleImageError = () => {
    console.log("Image failed to load, using default placeholder");
    setAvatarError(true);
  };
  
  // Initialize avatar from user metadata or provider
  useEffect(() => {
    if (!user) return;
    setAvatarError(false);

    // Check for avatar from auth provider
    const provider = user.app_metadata.provider;
    
    if (provider === 'github') {
      // GitHub users have avatar_url in user_metadata from OAuth
      const githubAvatar = user.user_metadata?.avatar_url;
      if (githubAvatar) {
        setAvatar(githubAvatar);
        return;
      }
    } 
    else if (provider === 'google') {
      // Google users have picture in user_metadata from OAuth
      const googleAvatar = user.user_metadata?.picture;
      if (googleAvatar) {
        setAvatar(googleAvatar);
        return;
      }
    }
    
    // Fall back to custom uploaded avatar
    if (user.user_metadata?.avatar_url) {
      setAvatar(user.user_metadata.avatar_url);
    } else {
      // If no avatar found, use default placeholder
      setAvatar(DEFAULT_AVATAR);
    }
  }, [user]);

  // Fetch active task count from Supabase
  const fetchTaskCount = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching task count for user:', user.id);
      
      // Count tasks that are not completed (Todo or In Progress)
      const { data, count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['Todo', 'In Progress']); // Count Todo and In Progress as active
        
      if (error) {
        console.error('Error fetching task count:', error);
        return;
      }
      
      console.log('Active tasks:', data);
      console.log('Task count:', count);
      
      // Update the active task count
      setActiveTaskCount(count || 0);
    } catch (error) {
      console.error('Error in fetchTaskCount:', error);
    }
  };

  // Set up real-time subscription for task changes
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up task subscription for user:', user.id);
    
    // Subscribe to task changes
    const subscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('Task changed, fetching updated count');
        fetchTaskCount();
      })
      .subscribe();
    
    // Fetch initial task count
    fetchTaskCount();
    
    // Cleanup subscription
    return () => {
      console.log('Cleaning up task subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  // Update task limit based on subscription using the shared function
  const updateTaskLimit = async () => {
    if (!user) {
      setCurrentTaskLimit(FREE_PLAN_TASK_LIMIT);
      return;
    }
    
    try {
      const userTaskLimit = await getUserTaskLimit(user.id);
      setCurrentTaskLimit(userTaskLimit);
    } catch (err) {
      console.error('Error getting user task limit:', err);
      setCurrentTaskLimit(FREE_PLAN_TASK_LIMIT);
    }
  };

  // Load user's subscription information
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      
      setLoadingSubscription(true);
      try {
        const subscription = await getUserSubscription(user.id);
        if (subscription) {
          setUserSubscription({
            planId: subscription.planId,
            status: subscription.status,
            subscriptionId: subscription.subscriptionId
          });
          
          // Set the selected plan based on the active subscription
          const planIndex = SUBSCRIPTION_PLANS.findIndex(p => p.paypalPlanId === subscription.planId);
          if (planIndex >= 0) {
            setSelectedPlan(SUBSCRIPTION_PLANS[planIndex].id);
          }
        } else {
          // Free plan by default - no need to create a subscription record for it
          setUserSubscription(null);
          setSelectedPlan(null);
        }
        
        // Update task limit after loading subscription
        await updateTaskLimit();
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, [user]);

  // Fetch task count when subscription changes
  useEffect(() => {
    if (user) {
      fetchTaskCount();
    }
  }, [user, userSubscription]);

  // Debug user info
  useEffect(() => {
    if (user) {
      console.log('User provider:', user.app_metadata.provider);
      console.log('User metadata:', user.user_metadata);
    }
  }, [user]);

  // No subscription handling needed - auto-assigned in the loadSubscription function

  // Calculate usage percentage based on the current task limit
  const usagePercentage = Math.min((activeTaskCount / currentTaskLimit) * 100, 100);
  const remainingTasks = Math.max(currentTaskLimit - activeTaskCount, 0);

  // Determine if a plan is active
  const isPlanActive = (planId: string): boolean => {
    if (!userSubscription) return false;
    return userSubscription.planId === planId && 
           userSubscription.status === 'active';
  };

  // Handle PayPal subscription approval
  const handleSubscriptionApproved = async (data: any) => {
    console.log('Subscription approved:', data);
    
    if (!user) return;
    
    const { subscriptionID } = data;
    if (!subscriptionID) {
      setSubscriptionMessage('Error: Missing subscription ID from PayPal');
      setSubscriptionStatus('error');
      return;
    }
    
    // Get the selected plan
    const selectedPlanObj = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    if (!selectedPlanObj) {
      setSubscriptionMessage('Error: Selected plan not found');
      setSubscriptionStatus('error');
      return;
    }
    
    // Update user's subscription in the database
    try {
      const success = await updateUserSubscription(
        user.id,
        subscriptionID,
        selectedPlanObj.paypalPlanId,
        'pending' // Will be updated to active by webhook when payment completes
      );
      
      if (success) {
        setUserSubscription({
          planId: selectedPlanObj.paypalPlanId,
          status: 'pending',
          subscriptionId: subscriptionID
        });
        
        setSubscriptionId(subscriptionID);
        setSubscriptionMessage('Subscription created successfully! It will be activated soon.');
        setSubscriptionStatus('success');
      } else {
        setSubscriptionMessage('Error saving subscription to database');
        setSubscriptionStatus('error');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setSubscriptionMessage('Error processing subscription');
      setSubscriptionStatus('error');
    }
  };

  // Handle PayPal subscription error
  const handleSubscriptionError = (error: any) => {
    console.error('Subscription error:', error);
    setSubscriptionMessage('Error creating subscription: ' + (error.message || 'Unknown error'));
    setSubscriptionStatus('error');
  };

  // Handle development mode subscription
  const handleDevSubscribe = async (planId: string) => {
    if (!user) return;
    
    const selectedPlanObj = SUBSCRIPTION_PLANS.find(p => p.paypalPlanId === planId);
    if (!selectedPlanObj) {
      setSubscriptionMessage('Error: Selected plan not found');
      setSubscriptionStatus('error');
      return;
    }
    
    const success = await activateDevSubscription(user, planId);
    
    if (success) {
      setUserSubscription({
        planId: planId,
        status: 'active',
        subscriptionId: `dev-sub-${Date.now()}`
      });
      
      setSubscriptionMessage(`Development mode: Successfully subscribed to ${selectedPlanObj.name}`);
      setSubscriptionStatus('success');
      
      // Update task limit
      await updateTaskLimit();
    } else {
      setSubscriptionMessage('Error activating development subscription');
      setSubscriptionStatus('error');
    }
  };

  // Add a function to reset to free plan (only in dev mode)
  const resetToFreePlan = async () => {
    if (!user || !userSubscription) return;
    
    try {
      // Delete the user's subscription record
      const { error } = await supabase
        .from('user_plans')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error deleting subscription:', error);
        setSubscriptionMessage('Error resetting to free plan');
        setSubscriptionStatus('error');
        return;
      }
      
      // Reset state
      setUserSubscription(null);
      setSelectedPlan(null);
      
      // Update task limit
      await updateTaskLimit();
      
      setSubscriptionMessage('Successfully reset to free plan');
      setSubscriptionStatus('success');
    } catch (err) {
      console.error('Error resetting to free plan:', err);
      setSubscriptionMessage('Error resetting to free plan');
      setSubscriptionStatus('error');
    }
  };

  // Modify the renderSubscriptionPlans function to add a reset button
  const renderSubscriptionPlans = () => {
    return (
      <div>
        {/* Dev Mode Banner and Controls */}
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
          <div className="flex items-start">
            <div className="text-amber-600 mr-3 text-xl">
              <span className="material-symbols-outlined">code</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-amber-800 text-lg">PayPal Development Mode</h3>
                <div className="flex items-center">
                  <span className={`mr-2 text-sm ${devModeEnabled ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    {devModeEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button 
                    onClick={toggleDevMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${devModeEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span 
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${devModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} 
                    />
                  </button>
                </div>
              </div>
              
              <p className="text-amber-700 mb-3 text-sm">
                When development mode is enabled, you can subscribe to plans without making real PayPal payments.
                This makes testing easier by using simulated subscriptions.
              </p>
              
              {devModeEnabled && (
                <>
                  <h4 className="font-medium text-amber-800 mb-2">Quick Actions:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <button
                        key={`dev-${plan.id}`}
                        onClick={() => handleDevSubscribe(plan.paypalPlanId)}
                        className="px-3 py-1.5 bg-amber-100 border border-amber-300 rounded text-amber-800 hover:bg-amber-200 transition-colors text-sm flex items-center"
                      >
                        <span className="material-symbols-outlined text-sm mr-1">add_circle</span>
                        Activate {plan.name}
                      </button>
                    ))}
                    
                    {userSubscription && (
                      <button
                        onClick={resetToFreePlan}
                        className="px-3 py-1.5 bg-red-100 border border-red-300 rounded text-red-800 hover:bg-red-200 transition-colors text-sm flex items-center"
                      >
                        <span className="material-symbols-outlined text-sm mr-1">refresh</span>
                        Reset to Free Plan
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Current Plan Status */}
        {userSubscription && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-green-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <h3 className="font-semibold text-green-800">
                  Current Subscription: {
                    SUBSCRIPTION_PLANS.find(p => p.paypalPlanId === userSubscription.planId)?.name || 'Custom Plan'
                  }
                </h3>
                <p className="text-green-700">
                  Status: {userSubscription.status.charAt(0).toUpperCase() + userSubscription.status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isActive = isPlanActive(plan.paypalPlanId);
            
            return (
              <div 
                key={plan.id}
                className={`border ${isActive ? 'border-green-300' : plan.popular ? 'border-primary-200' : 'border-slate-200'} rounded-xl hover:shadow-md transition-shadow duration-200 overflow-hidden relative`}
              >
                  {plan.popular && !isActive && (
                    <div className="absolute top-0 right-0">
                        <span className="inline-block bg-primary-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                            Popular
                        </span>
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute top-0 right-0">
                        <span className="inline-block bg-green-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                            {userSubscription?.status === 'pending' ? 'Pending' : 'Active'}
                        </span>
                    </div>
                  )}
                  
                  <div className={`${isActive ? 'bg-green-50' : plan.popular ? 'bg-primary-50' : 'bg-slate-50'} p-4 border-b ${isActive ? 'border-green-200' : plan.popular ? 'border-primary-200' : 'border-slate-200'}`}>
                      <h4 className="text-xl font-semibold text-slate-800 mb-1">{plan.name}</h4>
                      <p className="text-slate-600 mb-2">{plan.description}</p>
                      <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-slate-800">{plan.price}</span>
                          <span className="text-slate-600 mb-1">{plan.period}</span>
                      </div>
                  </div>
                  <div className="p-4">
                      <ul className="space-y-3 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-slate-700">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                {feature}
                            </li>
                          ))}
                      </ul>

                      <div className="mt-4 space-y-2">
                        {/* Show dev mode quick subscribe button */}
                        {devModeEnabled && !isActive && (
                          <button 
                            onClick={() => handleDevSubscribe(plan.paypalPlanId)}
                            className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-sm mr-1">bolt</span>
                            Dev: Activate Instantly
                          </button>
                        )}
                        
                        {/* Regular subscription button - only show if dev mode is off or if the plan is not active */}
                        {(!devModeEnabled || !isActive) && (
                          selectedPlan === plan.id ? (
                            <PayPalSubscribeButton
                              clientId={PAYPAL_CLIENT_ID}
                              planId={plan.paypalPlanId}
                              onApprove={handleSubscriptionApproved}
                              onError={handleSubscriptionError}
                              buttonStyle={{
                                color: 'gold',
                                label: 'subscribe'
                              }}
                            />
                          ) : !isActive && (
                            <button 
                              onClick={() => setSelectedPlan(plan.id)}
                              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Select Plan
                            </button>
                          )
                        )}
                      </div>
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-zinc-800 border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Profile</h2>
          <p>Please log in to view settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      {/* Profile Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Profile</h2>
        
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatar && !avatarError ? (
                <img 
                  src={avatar} 
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-300"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold border-2 border-primary-300">
                  {getInitials()}
                </div>
              )}
              
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  disabled={uploading} 
                  className="hidden" 
                />
              </label>
            </div>
            <span className="text-sm text-slate-500">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <p className="mb-2 text-slate-700">
              <strong>Name:</strong> {user?.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous"}
            </p>
            <p className="mb-2 text-slate-700">
              <strong>Email:</strong> {user?.email}
            </p>
            {user.app_metadata?.provider && (
              <p className="text-slate-700">
                <strong>Sign-in method:</strong> {user.app_metadata.provider.charAt(0).toUpperCase() + user.app_metadata.provider.slice(1)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Subscription Plans</h3>
          
        {loadingSubscription && (
          <div className="p-4 mb-6 bg-blue-50 text-blue-800 rounded">
            Loading your subscription information...
          </div>
        )}
          
        {subscriptionMessage && (
          <div className={`p-4 mb-6 rounded ${subscriptionStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {subscriptionMessage}
          </div>
        )}
          
        {renderSubscriptionPlans()}
      </div>

      {/* Task Usage */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary-600">insights</span>
                  </div>
                  <div>
                      <h3 className="font-medium text-slate-800">Task Usage</h3>
                      <p className="text-sm text-slate-600">
                        {activeTaskCount} of {currentTaskLimit} active tasks used
                        {userSubscription ? '' : ' (Free Plan)'}
                      </p>
                  </div>
              </div>
              <div className="w-full sm:w-64">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>{usagePercentage.toFixed(0)}% used</span>
                      <span>{remainingTasks} remaining</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${usagePercentage >= 90 ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{width: `${usagePercentage}%`}}
                      ></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
} 