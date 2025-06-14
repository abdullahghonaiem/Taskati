import { useState, useEffect, useRef } from 'react';
import PayPalIntegration from './PayPalIntegration';

// Add PayPal types to window
declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalSubscribeButtonProps {
  clientId: string;
  planId: string;
  onApprove: (data: any) => void;
  onError: (error: any) => void;
  buttonStyle?: {
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    label?: 'subscribe' | 'paypal' | 'checkout' | 'buynow' | 'pay';
  };
}

const PayPalSubscribeButton = ({
  clientId,
  planId,
  onApprove,
  onError,
  buttonStyle = { color: 'gold', label: 'subscribe' }
}: PayPalSubscribeButtonProps) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderAttempts, setRenderAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handler when PayPal SDK is ready
  const handleSdkReady = () => {
    console.log('PayPal SDK is ready for button rendering');
    setSdkReady(true);
    setRenderAttempts(0); // Reset render attempts when SDK is ready
  };
  
  // Function to render the PayPal button
  const renderPayPalButton = () => {
    if (!sdkReady || buttonRendered) return;
    
    setLoading(true);
    console.log(`Attempting to render PayPal button (attempt ${renderAttempts + 1})`);
    
    const container = containerRef.current;
    if (!container) {
      console.error('PayPal button container ref not found');
      setError('Container not found - please try again');
      setLoading(false);
      return;
    }
    
    // Clear container before rendering
    container.innerHTML = '';
    
    try {
      console.log('Creating PayPal buttons with plan ID:', planId);
      const buttons = window.paypal.Buttons({
        style: {
          color: buttonStyle.color,
          label: buttonStyle.label,
          shape: 'rect',
          layout: 'vertical',
          tagline: false
        },
        createSubscription: (data: any, actions: any) => {
          console.log('Creating subscription for plan:', planId);
          return actions.subscription.create({
            plan_id: planId
          });
        },
        onApprove: (data: any, actions: any) => {
          console.log('Subscription approved:', data);
          onApprove(data);
        },
        onError: (err: any) => {
          console.error('PayPal button error:', err);
          setError('PayPal subscription failed');
          onError(err);
        }
      });
      
      if (buttons.isEligible()) {
        console.log('PayPal buttons eligible, rendering...');
        buttons.render(container).then(() => {
          console.log('PayPal button rendered successfully');
          setButtonRendered(true);
          setError(null);
          setLoading(false);
        }).catch((err: any) => {
          console.error('Error rendering PayPal button:', err);
          setError('Failed to render PayPal button');
          setLoading(false);
          
          // Try again if we haven't exceeded max attempts
          if (renderAttempts < 3) {
            setRenderAttempts(prev => prev + 1);
          }
        });
      } else {
        console.error('PayPal buttons not eligible');
        setError('PayPal checkout not available in this browser');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error setting up PayPal buttons:', err);
      setError('Error initializing PayPal');
      setLoading(false);
      
      // Try again if we haven't exceeded max attempts
      if (renderAttempts < 3) {
        setRenderAttempts(prev => prev + 1);
      }
    }
  };
  
  // Render the PayPal button when SDK is ready
  useEffect(() => {
    if (sdkReady && !buttonRendered) {
      renderPayPalButton();
    }
  }, [sdkReady, buttonRendered, renderAttempts]);
  
  return (
    <div className="paypal-button-wrapper">
      <PayPalIntegration clientId={clientId} onSdkReady={handleSdkReady} />
      
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      <div className="w-full min-h-[45px] relative">
        {loading && !buttonRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-70 rounded">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="paypal-button-container"
          id="paypal-button-container"
          style={{ minHeight: '45px' }}
        ></div>
      </div>
      
      {/* Debug button to retry rendering */}
      {error && (
        <button 
          onClick={() => {
            setButtonRendered(false);
            setRenderAttempts(prev => prev + 1);
          }}
          className="w-full mt-2 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 text-sm rounded"
        >
          Retry PayPal Button
        </button>
      )}
    </div>
  );
};

export default PayPalSubscribeButton; 