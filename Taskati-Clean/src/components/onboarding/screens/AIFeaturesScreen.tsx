import { Sparkles, Mic, MessageSquare, Zap } from 'lucide-react';

export default function AIFeaturesScreen() {
  return (
    <div className="text-center py-2">
      <div className="mb-4">
        <Sparkles className="h-10 w-10 text-yellow-400 mx-auto" />
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight mb-3">
        AI-Powered Assistance
      </h1>
      
      <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
        Taskati includes powerful AI features to help you create, organize, and manage tasks more efficiently.
      </p>
      
      {/* AI Features Grid */}
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
        {/* AI Chat */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mt-8 -mr-8 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="relative">
            <div className="flex items-center mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-base font-medium text-slate-900 ml-3">AI Chat Assistant</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-2">
              Chat with our AI to quickly create tasks, get suggestions, and organize your workflow.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <div className="flex">
                <div className="bg-blue-500 text-white p-1 rounded-lg text-xs">AI</div>
                <div className="ml-2 text-xs text-slate-700">
                  "I'll create a task to update the project timeline."
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Voice Commands */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full -mt-8 -mr-8 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="relative">
            <div className="flex items-center mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <Mic className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-base font-medium text-slate-900 ml-3">Voice Commands</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-2">
              Use voice commands for hands-free task management when you're on the go.
            </p>
            
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-center">
              <div className="text-xs text-slate-700 flex items-center">
                <span className="material-symbols-outlined text-red-500 animate-pulse mr-2">mic</span>
                "Add a task to call client tomorrow"
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 max-w-md mx-auto">
        <div className="flex items-center mb-1">
          <Zap className="h-4 w-4 text-purple-600 mr-2" />
          <h3 className="font-medium text-sm text-purple-700">Smart Suggestions</h3>
        </div>
        <p className="text-purple-700 text-xs">
          Our AI learns from your task patterns and provides personalized suggestions to improve your productivity.
        </p>
      </div>
    </div>
  );
} 