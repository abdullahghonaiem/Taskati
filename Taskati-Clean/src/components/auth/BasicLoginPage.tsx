import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function BasicLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Sign up with email and password
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;
        setMessage("Check your email for the confirmation link");
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

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            {mode === "signin" ? "Sign in to your account" : "Create an account"}
          </h2>
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {mode === "signin"
              ? "Enter your email below to sign in to your account"
              : "Enter your email below to create your account"}
          </p>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem'
        }}>
          {/* OAuth Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" style={{ marginRight: '0.5rem' }}>
                <path fill="#4285F4" d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" />
                <path fill="#34A853" d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" />
                <path fill="#FBBC04" d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" />
                <path fill="#EA4335" d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" fill="currentColor" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              flexGrow: 1,
              height: '1px',
              backgroundColor: '#e5e7eb'
            }}></div>
            <span style={{
              padding: '0 0.75rem',
              color: '#6b7280',
              fontSize: '0.75rem',
              textTransform: 'uppercase'
            }}>Or continue with</span>
            <div style={{ 
              flexGrow: 1,
              height: '1px',
              backgroundColor: '#e5e7eb'
            }}></div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <label 
                htmlFor="email" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label 
                htmlFor="password" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.375rem',
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                border: 'none',
                marginTop: '0.5rem'
              }}
            >
              {loading ? "Processing..." : (mode === "signin" ? "Sign in" : "Sign up")}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <span>
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0',
              color: '#2563eb',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
} 