import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Github, Mail, AlertCircle, CheckCircle2, Sparkles, Mic, Zap, Eye, EyeOff, LockKeyhole, User, X, Check } from "lucide-react";
import { signUpWithoutConfirmation } from "../../lib/services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password validation states
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasMinLength, setHasMinLength] = useState(false);

  // Animation trigger after component mounts
  useEffect(() => {
    setAnimate(true);
  }, []);

  // Check password requirements
  useEffect(() => {
    setHasLowerCase(/[a-z]/.test(password));
    setHasUpperCase(/[A-Z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasMinLength(password.length >= 6);
  }, [password]);

  const validateForm = () => {
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      
      if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasMinLength) {
        setError("Password must contain at least one lowercase letter, one uppercase letter, one number, and be at least 6 characters long");
        return false;
      }
    }
    return true;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signin") {
        // Sign in with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        // Use our custom signup function that handles immediate login
        const result = await signUpWithoutConfirmation(email, password);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to create account");
        }
        
        // No need to show any message on success, as the user will be redirected
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("OAuth error:", error);
      setError(error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  // Reset form when switching modes
  useEffect(() => {
    setError(null);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordFocused(false);
  }, [mode]);

  // Calculate password strength
  const getPasswordStrength = () => {
    let strength = 0;
    if (hasLowerCase) strength += 25;
    if (hasUpperCase) strength += 25;
    if (hasNumber) strength += 25;
    if (hasMinLength) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    if (passwordStrength < 100) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Fair';
    if (passwordStrength < 100) return 'Good';
    return 'Strong';
  };

  // Render password requirement item
  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <X className="h-3.5 w-3.5 text-red-500" />
      )}
      <span className={met ? "text-green-700" : "text-slate-600"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Branded Side Panel */}
      <div className={`bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 md:p-12 flex flex-col justify-between md:w-1/2 transition-all duration-700 ease-out ${animate ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
        <div>
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight flex items-center">
              Taskati <Sparkles className="ml-2 h-5 w-5 text-yellow-300 animate-pulse" />
            </h1>
            <p className="text-primary-100 mt-2">Organize your workflow, boost your productivity.</p>
          </div>

          <div className="hidden md:block">
            <h2 className="text-2xl font-medium mb-6">Why Taskati?</h2>
            <ul className="space-y-5">
              <li className={`flex items-start transition-all duration-500 ease-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
                <CheckCircle2 className="h-6 w-6 text-primary-300 mr-3 mt-0.5" />
                <span>Intuitive board system to visualize your workflow</span>
              </li>
              <li className={`flex items-start transition-all duration-500 ease-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
                <CheckCircle2 className="h-6 w-6 text-primary-300 mr-3 mt-0.5" />
                <span>Track your progress with insightful analytics</span>
              </li>
              <li className={`flex items-start transition-all duration-500 ease-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
                <CheckCircle2 className="h-6 w-6 text-primary-300 mr-3 mt-0.5" />
                <span>Collaborate seamlessly with your team</span>
              </li>
              <li className={`flex items-start transition-all duration-500 ease-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
                <Sparkles className="h-6 w-6 text-yellow-300 mr-3 mt-0.5 animate-pulse" />
                <span>AI assistant chat to help you create and organize tasks</span>
              </li>
              <li className={`flex items-start transition-all duration-500 ease-out ${animate ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
                <Mic className="h-6 w-6 text-red-300 mr-3 mt-0.5" />
                <span>Voice commands for hands-free task management</span>
              </li>
            </ul>

            <div className={`mt-8 bg-primary-700/50 p-4 rounded-lg border border-primary-400/30 transition-all duration-700 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '1200ms' }}>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-yellow-300 mr-2 animate-bounce" />
                <h3 className="font-semibold text-white">Powered by AI</h3>
              </div>
              <p className="text-sm text-primary-100 mt-2">
                Our AI-powered assistant helps you create tasks, organize workflows, and boost productivity with intelligent suggestions.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block text-sm opacity-75 mt-12">
          &copy; {new Date().getFullYear()} Taskati. All rights reserved.
        </div>
      </div>

      {/* Auth Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <Card className={`w-full max-w-md border-none shadow-xl bg-white transition-all duration-700 ease-out ${animate ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`} style={{ transitionDelay: '300ms' }}>
          <CardHeader className="space-y-1 pt-8 pb-4">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 hover:scale-110">
                <span className="material-symbols-outlined text-3xl text-primary-600">task_alt</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-slate-500 mt-1 text-center">
                {mode === "signin"
                  ? "Sign in to access your Taskati dashboard"
                  : "Join Taskati to start organizing your tasks"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-4 pt-0">
            {/* OAuth Sign-in Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                className="w-full py-6 bg-white hover:bg-slate-50 border border-slate-200 transition-transform hover:scale-105"
                onClick={() => handleOAuthLogin("google")}
                disabled={loading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
                    fill="#34A853"
                  />
                  <path
                    d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
                    fill="#FBBC04"
                  />
                  <path
                    d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full py-6 bg-white hover:bg-slate-50 border border-slate-200 transition-transform hover:scale-105"
                onClick={() => handleOAuthLogin("github")}
                disabled={loading}
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Sign-in Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center">
                  <User className="w-4 h-4 mr-2 text-primary-500" />
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="py-5 px-4 pl-10 bg-slate-50 border-slate-200 focus:ring-primary-500 transition-all focus:scale-[1.01]"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center">
                  <LockKeyhole className="w-4 h-4 mr-2 text-primary-500" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => mode === "signin" && setPasswordFocused(false)}
                    required
                    className="py-5 px-4 pl-10 pr-10 bg-slate-50 border-slate-200 focus:ring-primary-500 transition-all focus:scale-[1.01]"
                  />
                  <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? 
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-primary-500 transition-colors" /> : 
                      <Eye className="h-5 w-5 text-slate-400 hover:text-primary-500 transition-colors" />
                    }
                  </button>
                </div>

                {/* Password strength indicator - only in signup mode or when password field is focused */}
                {(mode === "signup" || (mode === "signin" && passwordFocused && password)) && (
                  <div className="mt-2 space-y-2">
                    {password && (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Password strength:</span>
                            <span className={`font-medium ${
                              passwordStrength < 50 ? 'text-red-600' : 
                              passwordStrength < 75 ? 'text-yellow-600' : 
                              passwordStrength < 100 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {getStrengthText()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                              style={{ width: `${passwordStrength}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-2">
                          <PasswordRequirement met={hasLowerCase} text="One lowercase letter (a-z)" />
                          <PasswordRequirement met={hasUpperCase} text="One uppercase letter (A-Z)" />
                          <PasswordRequirement met={hasNumber} text="One number (0-9)" />
                          <PasswordRequirement met={hasMinLength} text="At least 6 characters" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 flex items-center">
                    <LockKeyhole className="w-4 h-4 mr-2 text-primary-500" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="py-5 px-4 pl-10 pr-10 bg-slate-50 border-slate-200 focus:ring-primary-500 transition-all focus:scale-[1.01]"
                    />
                    <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? 
                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-primary-500 transition-colors" /> : 
                        <Eye className="h-5 w-5 text-slate-400 hover:text-primary-500 transition-colors" />
                      }
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 flex items-start animate-shake">
                  <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 flex items-start animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
                  <span>{message}</span>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full py-6 bg-primary-600 hover:bg-primary-700 transition-all duration-300 hover:scale-[1.02] mt-2 ${
                  (mode === "signup" && (password && confirmPassword && password !== confirmPassword || !hasLowerCase || !hasUpperCase || !hasNumber || !hasMinLength))
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
                disabled={loading || (mode === "signup" && (password && confirmPassword && password !== confirmPassword || !hasLowerCase || !hasUpperCase || !hasNumber || !hasMinLength ? true : false))}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center font-medium">
                    <Mail className="mr-2 h-5 w-5" />
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="px-8 py-6 flex justify-center border-t border-slate-100">
            <p className="text-sm text-slate-600">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors hover:underline"
                type="button"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Mobile Footer */}
      <div className="md:hidden bg-primary-900 text-white p-4 text-center text-xs">
        &copy; {new Date().getFullYear()} Taskati. All rights reserved.
      </div>
    </div>
  );
} 