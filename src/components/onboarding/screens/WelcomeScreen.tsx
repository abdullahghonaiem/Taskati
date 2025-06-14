import { Sparkles, CheckCircle } from 'lucide-react';

interface WelcomeScreenProps {
  userEmail?: string;
}

export default function WelcomeScreen({ userEmail }: WelcomeScreenProps) {
  const username = userEmail ? userEmail.split('@')[0] : 'there';
  
  return (
    <div className="text-center">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 bg-primary-100 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary-600">task_alt</span>
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Welcome to Taskati, {username}!
      </h1>
      
      <p className="text-lg text-gray-600 mb-6 max-w-lg mx-auto">
        We're excited to help you organize your tasks and boost your productivity.
        Let's take a quick tour to get you started.
      </p>
      
      <div className="bg-primary-50 p-6 rounded-lg border border-primary-100 max-w-md mx-auto">
        <h3 className="font-medium text-primary-700 mb-2">Get ready to:</h3>
        <ul className="text-left space-y-3">
          <li className="flex items-start">
            <div className="feature-item">
              <CheckCircle className="h-5 w-5 text-primary-600" />
              <span>Organize tasks with an intuitive board system</span>
            </div>
          </li>
          <li className="flex items-start">
            <span className="material-symbols-outlined text-primary-500 mr-3 mt-0.5">check_circle</span>
            <span>Use AI-powered tools to manage your workflow</span>
          </li>
          <li className="flex items-start">
            <span className="material-symbols-outlined text-primary-500 mr-3 mt-0.5">check_circle</span>
            <span>Track your progress with visual analytics</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 