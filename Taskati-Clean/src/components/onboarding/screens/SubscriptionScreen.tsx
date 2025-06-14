import { Gem, CheckCircle, BarChart } from 'lucide-react';

export default function SubscriptionScreen() {
  return (
    <div className="text-center py-2">
      <div className="mb-4">
        <Gem className="h-10 w-10 text-purple-500 mx-auto" />
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight mb-3">
        Choose Your Plan
      </h1>
      
      <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
        Taskati offers flexible plans to fit your needs. Start with our Free Plan and upgrade anytime.
      </p>
      
      {/* Plan Comparison */}
      <div className="max-w-2xl mx-auto">
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {/* Free Plan */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="text-center mb-2">
              <h3 className="text-base font-semibold text-slate-800">Free Plan</h3>
              <div className="text-2xl font-bold text-primary-600 my-1">$0</div>
              <p className="text-slate-500 text-xs">Perfect for getting started</p>
            </div>
            
            <ul className="space-y-1">
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>5 active tasks</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Basic AI assistance</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Standard support</span>
              </li>
            </ul>
            
            <div className="mt-2 text-center">
              <span className="text-xs text-slate-500">Current plan</span>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-white rounded-xl border-2 border-primary-400 p-3 shadow-md hover:shadow-lg transition-shadow relative transform scale-105">
            <div className="absolute top-0 right-0">
              <span className="bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-bl-lg rounded-tr-lg">Popular</span>
            </div>
            
            <div className="text-center mb-2">
              <h3 className="text-base font-semibold text-slate-800">Pro Plan</h3>
              <div className="text-2xl font-bold text-primary-600 my-1">$12<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <p className="text-slate-500 text-xs">For productivity enthusiasts</p>
            </div>
            
            <ul className="space-y-1">
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>25 active tasks</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Advanced AI features</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Voice commands</span>
              </li>
            </ul>
          </div>
          
          {/* Premium Plan */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="text-center mb-2">
              <h3 className="text-base font-semibold text-slate-800">Premium</h3>
              <div className="text-2xl font-bold text-primary-600 my-1">$25<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <p className="text-slate-500 text-xs">For teams and power users</p>
            </div>
            
            <ul className="space-y-1">
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>50 active tasks</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>All Pro features</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Team collaboration</span>
              </li>
              <li className="flex items-center text-xs text-slate-700">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                <span>Advanced analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 max-w-md mx-auto flex items-start">
        <BarChart className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-left">
          <h3 className="font-medium text-xs text-blue-700 mb-1">Track Your Progress</h3>
          <p className="text-blue-700 text-xs">
            All plans include task analytics to help you monitor your productivity.
          </p>
        </div>
      </div>
    </div>
  );
} 