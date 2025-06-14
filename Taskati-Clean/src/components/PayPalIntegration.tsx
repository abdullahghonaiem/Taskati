import { useState, useEffect } from 'react';

interface PayPalIntegrationProps {
  clientId: string;
  onSdkReady?: () => void;
}

const PayPalIntegration = ({ clientId, onSdkReady }: PayPalIntegrationProps) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  useEffect(() => {
    console.log('Initializing PayPal SDK with client ID:', clientId);
    
    // Function to load the PayPal SDK script
    const loadPayPalScript = () => {
      // Clear any previous errors
      setLoadError(null);
      
      // Check if the script is already loaded
      const existingScript = document.getElementById('paypal-sdk-script');
      if (existingScript) {
        console.log('PayPal script already exists, checking if SDK is ready');
        
        // Check if the SDK is actually loaded and available
        if (window.paypal && window.paypal.Buttons) {
          console.log('PayPal SDK is ready');
          setSdkReady(true);
          onSdkReady?.();
        } else {
          console.error('PayPal script exists but SDK is not available');
          
          // If we've tried less than 3 times, try removing and reloading
          if (loadAttempts < 3) {
            console.log(`Retrying PayPal script load (attempt ${loadAttempts + 1})`);
            document.body.removeChild(existingScript);
            setLoadAttempts(prev => prev + 1);
            setTimeout(loadPayPalScript, 500);
          } else {
            setLoadError('PayPal SDK failed to load properly after multiple attempts');
          }
        }
        return;
      }

      // Create script element with specific parameters
      const script = document.createElement('script');
      script.id = 'paypal-sdk-script';
      // Add currency and disable funding methods that might not be available
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`;
      script.async = true;
      
      // Set up onload handler
      script.onload = () => {
        console.log('PayPal SDK script loaded');
        
        // Verify the SDK is actually available
        if (window.paypal && window.paypal.Buttons) {
          console.log('PayPal SDK fully loaded with Buttons API');
          setSdkReady(true);
          setLoadError(null);
          onSdkReady?.();
        } else {
          console.error('PayPal script loaded but Buttons API not available');
          
          // Add a slight delay and check again
          setTimeout(() => {
            if (window.paypal && window.paypal.Buttons) {
              console.log('PayPal SDK available after delay');
              setSdkReady(true);
              setLoadError(null);
              onSdkReady?.();
            } else {
              setLoadError('PayPal SDK Buttons API not available');
            }
          }, 1500); // Increased delay for more reliable loading
        }
      };
      
      // Handle errors
      script.onerror = (error) => {
        console.error('Error loading PayPal SDK:', error);
        setLoadError('Failed to load PayPal SDK');
      };
      
      // Append script to document body
      console.log('Appending PayPal script to document body');
      document.body.appendChild(script);
    };

    loadPayPalScript();

    // Cleanup function
    return () => {
      console.log('PayPal integration component unmounting');
      // We don't remove the script on unmount to prevent reloading issues
    };
  }, [clientId, onSdkReady, loadAttempts]);

  // If there's a load error, render it
  if (loadError) {
    return (
      <div className="p-3 mb-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
        <div className="font-bold mb-1">PayPal SDK Error:</div>
        <div>{loadError}</div>
        <button 
          onClick={() => setLoadAttempts(prev => prev + 1)} 
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  // No visual output if everything is OK
  return null;
};

export default PayPalIntegration; 