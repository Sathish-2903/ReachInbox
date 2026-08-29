import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);

  // Check if OAuth is configured on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const status = await authApi.getStatus();
        setOauthConfigured(status.googleConfigured);
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setOauthConfigured(false);
      }
    };
    checkConfig();
  }, []);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    try {
      const url = await authApi.getGoogleAuthUrl();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Google OAuth URL not returned');
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      setErrorMessage(
        err.response?.data?.error || 
        'Google OAuth client is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend .env file.'
      );
      setLoadingGoogle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">Loading ReachInbox...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Animated Ambient Light Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 space-y-8 animate-fade-in">
        
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-500/20 transform hover:rotate-6 transition-all duration-300">
            R
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>ReachInbox</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                v1.0
              </span>
            </h2>
            <p className="text-sm text-gray-400">High-throughput cold outreach engine</p>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || oauthConfigured === false}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm rounded-2xl shadow-lg shadow-white/5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none group"
          >
            {loadingGoogle ? (
              <div className="w-5 h-5 rounded-full border-2 border-gray-900/20 border-t-gray-900 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{loadingGoogle ? 'Connecting to Google...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Configuration Notice if not setup */}
          {oauthConfigured === false && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Google OAuth Not Configured</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                OAuth details are missing in the backend <code className="text-indigo-400">.env</code>. Please open the file and add your client credentials:
              </p>
              <pre className="text-[10px] bg-black/40 border border-gray-800 p-2.5 rounded-lg text-emerald-400 font-mono overflow-x-auto select-all">
{`GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...`}
              </pre>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-red-400 animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-gray-850 flex items-center justify-between text-xs text-gray-500">
          <span>Secure OAuth 2.0</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Live
          </span>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
