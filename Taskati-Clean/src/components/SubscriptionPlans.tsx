import { useState } from 'react';
import PayPalSubscribeButton from './PayPalSubscribeButton';

// Sample subscription plans - in a real app, these might come from your backend or environment variables
const SUBSCRIPTION_PLANS = [
  {
    id: 1,
    name: 'Basic Plan',
    description: 'Access to basic features',
    price: '$9.99/month',
    paypalPlanId: 'P-XXXXXXXXXXXXXXX1', // Replace with your actual PayPal plan IDs
  },
  {
    id: 2,
    name: 'Pro Plan',
    description: 'Access to all features',
    price: '$19.99/month',
    paypalPlanId: 'P-XXXXXXXXXXXXXXX2',
  },
  {
    id: 3,
    name: 'Enterprise Plan',
    description: 'Access to all features plus priority support',
    price: '$49.99/month',
    paypalPlanId: 'P-XXXXXXXXXXXXXXX3',
  }
];

// Replace with your actual PayPal client ID
const PAYPAL_CLIENT_ID = 'YOUR_CLIENT_ID';

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');

  // Handler for successful subscription
  const handleSubscriptionApproved = (subId: string) => {
    setSubscriptionId(subId);
    setSubscriptionStatus('Subscription successful! Your subscription ID is: ' + subId);
    
    // Here you would typically make an API call to your backend to record the subscription
    console.log('Subscription successful, ID:', subId);
  };

  // Handler for subscription errors
  const handleSubscriptionError = (error: any) => {
    setSubscriptionStatus('Subscription failed: ' + error.message);
    console.error('Subscription error:', error);
  };

  return (
    <div className="subscription-plans-container">
      <h2 className="text-2xl font-bold mb-6">Choose a Subscription Plan</h2>
      
      {/* Display subscription success message if applicable */}
      {subscriptionStatus && (
        <div className={`p-4 mb-6 rounded ${subscriptionId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {subscriptionStatus}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`p-6 border rounded-lg shadow-sm cursor-pointer transition-all
              ${selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <p className="text-2xl font-bold mb-4">{plan.price}</p>
            
            {selectedPlan === plan.id && (
              <div className="mt-4">
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
              </div>
            )}
            
            {selectedPlan !== plan.id && (
              <button 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={() => setSelectedPlan(plan.id)}
              >
                Select Plan
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Note: You'll be redirected to PayPal to complete your subscription. You can cancel anytime from your account settings.</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans; 