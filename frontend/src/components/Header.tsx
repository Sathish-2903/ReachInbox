import React, { useState } from 'react';
import { User } from '../types';
import { authApi, slackApi } from '../services/api';
import { Activity, LogOut, MessageSquare, KeyRound, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  user: User | null;
  slackConnected: boolean;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, slackConnected, onRefreshUser }) => {
  const { logout } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const url = await authApi.getGoogleAuthUrl();
      if (url) {
        window.location.href = url;
      }
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
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-3.5 flex items-center justify-between shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/25">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">ReachInbox</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                Scheduler
              </span>
            </div>
            <p className="text-xs text-gray-400">High-throughput cold outreach engine</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Bull Board Queue Link */}
          <a
            href="/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/80 hover:bg-gray-700/80 hover:text-white border border-gray-700 rounded-lg transition-all"
            title="Open BullMQ Queue Inspector"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Queue Board</span>
          </a>

          {/* Slack Connection Pill */}
          <button
            onClick={handleSlackToggle}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              slackConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:bg-gray-700/80'
            }`}
            title={slackConnected ? 'Slack connected (click to disconnect)' : 'Connect Slack for rate limit alerts'}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${slackConnected ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span>{slackConnected ? 'Slack Active' : 'Connect Slack'}</span>
            <span
              className={`w-2 h-2 rounded-full ${slackConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}
            />
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-gray-700 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name || user.email}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{loadingGoogle ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Google OAuth Credentials Configuration Notice Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Google OAuth Setup Required</h2>
                  <p className="text-xs text-gray-400">Configure Google credentials to enable sign-in</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Body */}
            <div className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-4 text-xs text-gray-300 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-gray-200">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Add Google Cloud credentials to <code className="text-indigo-300 bg-gray-800 px-1.5 py-0.5 rounded">backend/.env</code></span>
              </div>
              <pre className="text-[11px] bg-gray-950 p-3 rounded-lg border border-gray-800 text-emerald-400 font-mono overflow-x-auto leading-relaxed">
{`GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback`}
              </pre>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                1. Create an OAuth 2.0 Client ID in your Google Cloud Console.<br />
                2. Set the Authorized redirect URI to <code className="text-indigo-300">http://localhost:3000/api/auth/google/callback</code>.<br />
                3. Paste the client ID and secret into <code className="text-indigo-300">backend/.env</code> and restart the backend.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

