import React, { useState } from 'react';
import { User } from '../types';
import { authApi, slackApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  MessageSquare,
  Activity,
  KeyRound,
  X,
  AlertCircle,
  BellRing,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  slackConnected: boolean;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, slackConnected, onRefreshUser }) => {
  const { logout } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const url = await authApi.getGoogleAuthUrl();
      if (url) window.location.href = url;
    } catch {
      setIsConfigModalOpen(true);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSlackToggle = async () => {
    if (slackConnected) {
      if (confirm('Disconnect Slack notifications?')) {
        await slackApi.disconnect();
        onRefreshUser();
      }
    } else {
      try {
        const url = await slackApi.getAuthUrl();
        window.location.href = url;
      } catch {
        alert('Slack OAuth not configured in backend .env yet');
      }
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  // Greeting by hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <>
      <header
        className="fixed top-0 right-0 z-10 flex items-center justify-between px-6 py-3"
        style={{
          left: '224px', /* sidebar width */
          background: 'rgba(11,18,32,0.90)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left — greeting */}
        <div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Here's a quick overview of your email outreach activity.
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Queue Board */}
          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            <Activity className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
            <span>Queue Board</span>
          </a>

          {/* Slack */}
          <button
            onClick={handleSlackToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: slackConnected ? 'var(--success-muted)' : 'var(--bg-card)',
              border: `1px solid ${slackConnected ? 'var(--success-border)' : 'var(--border)'}`,
              color: slackConnected ? 'var(--success)' : 'var(--text-secondary)',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{slackConnected ? 'Slack Active' : 'Connect Slack'}</span>
            {slackConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
            )}
          </button>

          {/* Notifications placeholder */}
          <button
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <BellRing className="w-4 h-4" />
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--teal)' }}>
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-10 w-48 rounded-xl overflow-hidden shadow-xl z-50"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors"
                    style={{ color: 'var(--danger)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--danger-muted)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'var(--teal)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#fff" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="rgba(255,255,255,.8)" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="rgba(255,255,255,.6)" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="rgba(255,255,255,.4)" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {loadingGoogle ? 'Signing in…' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </header>

      {/* Google OAuth Config Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--warning-muted)', border: '1px solid var(--warning-border)' }}>
                  <AlertCircle className="w-4.5 h-4.5" style={{ color: 'var(--warning)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Google OAuth Setup Required</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Configure Google credentials to enable sign-in</p>
                </div>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-lg p-4 space-y-2"
                style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                  Add to <code className="text-teal-400 bg-black/30 px-1 rounded">backend/.env</code>
                </div>
                <pre className="text-[11px] rounded-lg p-3 font-mono overflow-x-auto leading-relaxed select-all"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--teal)' }}>
{`GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback`}
                </pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
                  style={{ background: 'var(--teal)' }}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
