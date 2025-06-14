import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      if (!isSupabaseConfigured()) {
        setStatus('error');
        setErrorMessage('Supabase configuration is missing');
        return;
      }

      try {
        // Check connection by testing auth API which will work even without tables
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('error');
          setErrorMessage(`Connection error: ${error.message}`);
        } else {
          setStatus('connected');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    checkConnection();
  }, []);

  if (status === 'loading') {
    return <div className="supabase-status loading">Checking Supabase connection...</div>;
  }

  if (status === 'error') {
    return (
      <div className="supabase-status error">
        <p>Supabase connection error:</p>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="supabase-status connected">
      ✅ Connected to Supabase
    </div>
  );
} 