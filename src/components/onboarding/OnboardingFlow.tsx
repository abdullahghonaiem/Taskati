import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ChevronRight, ChevronLeft, X, Sparkles, Layout, Mic, MessageSquare, Zap } from 'lucide-react';

// Import onboarding screen components
import WelcomeScreen from './screens/WelcomeScreen';
import KanbanScreen from './screens/KanbanScreen';
import AIFeaturesScreen from './screens/AIFeaturesScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
  userEmail?: string;
}

export default function OnboardingFlow({ onComplete, userEmail }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animate, setAnimate] = useState(false);
  
  // Animation effect when component mounts
  useEffect(() => {
    setAnimate(true);
  }, []);

  // Define the onboarding steps/screens
  const steps = [
    <WelcomeScreen key="welcome" userEmail={userEmail} />,
    <KanbanScreen key="kanban" />,
    <AIFeaturesScreen key="ai" />,
    <SubscriptionScreen key="subscription" />
  ];

  // Move to the next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setAnimate(false);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimate(true);
      }, 300);
    } else {
      // Complete onboarding
      setAnimate(false);
      setTimeout(() => {
        onComplete();
      }, 300);
    }
  };

  // Move to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setAnimate(false);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimate(true);
      }, 300);
    }
  };

  // Skip onboarding
  const skipOnboarding = () => {
    setAnimate(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // Progress indicator
  const renderProgressDots = () => {
    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'bg-primary-600 w-6'
                : index < currentStep
                ? 'bg-primary-400'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-6">
      {/* Skip button */}
      <button
        onClick={skipOnboarding}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Skip onboarding"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Content area with overflow handling */}
      <div className="flex-1 w-full flex flex-col items-center overflow-hidden">
        <div 
          className={`max-w-2xl w-full h-full overflow-y-auto pb-4 transition-all duration-500 ease-in-out ${
            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {steps[currentStep]}
        </div>
      </div>

      {/* Fixed bottom section with progress indicator and navigation */}
      <div className="w-full mt-4 bg-white pt-2 z-10">
        {/* Progress indicator */}
        {renderProgressDots()}
        
        {/* Navigation buttons */}
        <div className="flex justify-between w-full max-w-md mt-6 mx-auto">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`${currentStep === 0 ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button onClick={nextStep} className="bg-primary-600 hover:bg-primary-700 text-white">
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'Get Started'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 