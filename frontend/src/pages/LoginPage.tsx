import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { AlertCircle, AlertTriangle } from 'lucide-react';

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

  // Redirect to dashboard if already logged in
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
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--teal-muted)', borderTopColor: 'var(--teal)' }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Loading ReachInbox…
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-base)', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
            style={{ background: 'var(--teal)' }}
          >
            R
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ReachInbox
          </span>
        </div>

        {/* Testimonial / tagline */}
        <div className="space-y-6">
          <blockquote className="space-y-3">
            <p className="text-xl font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              "Send smarter, reach further — automated outreach that actually converts."
            </p>
            <footer className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              High-throughput email scheduling powered by BullMQ &amp; Redis.
            </footer>
          </blockquote>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              { label: 'Rate-limit protection', color: 'var(--teal)' },
              { label: 'Real-time delivery tracking', color: 'var(--success)' },
              { label: 'Slack notifications', color: 'var(--warning)' },
              { label: 'Elasticsearch-powered search', color: 'var(--blue)' },
            ].map(({ label, color }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          © 2025 ReachInbox · v1.0.0
        </p>
      </div>

      {/* Right panel — login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7 animate-fade-in">

          {/* Logo (mobile only) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
              style={{ background: 'var(--teal)' }}
            >
              R
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              ReachInbox
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to access your outreach dashboard.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || oauthConfigured === false}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#fff', color: '#1f2937' }}
            onMouseEnter={e => {
              if (!loadingGoogle && oauthConfigured !== false)
                (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
            }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
          >
            {loadingGoogle ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            )}
            <span>{loadingGoogle ? 'Connecting to Google…' : 'Continue with Google'}</span>
          </button>

          {/* OAuth not configured warning */}
          {oauthConfigured === false && (
            <div
              className="rounded-xl p-4 space-y-2 text-xs animate-fade-in"
              style={{
                background: 'var(--warning-muted)',
                border: '1px solid var(--warning-border)',
              }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--warning)' }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Google OAuth Not Configured
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                OAuth details are missing in the backend{' '}
                <code className="px-1 rounded text-xs" style={{ background: 'var(--bg-base)', color: 'var(--teal)' }}>
                  .env
                </code>
                . Add your client credentials:
              </p>
              <pre
                className="text-[10px] rounded-lg p-2.5 font-mono overflow-x-auto select-all leading-relaxed"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--teal)' }}
              >
{`GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...`}
              </pre>
            </div>
          )}

          {/* Runtime error */}
          {errorMessage && (
            <div
              className="rounded-xl p-4 flex items-start gap-2.5 text-xs animate-fade-in"
              style={{
                background: 'var(--danger-muted)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between text-[11px] pt-2"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <span>Secure OAuth 2.0</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              System Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
