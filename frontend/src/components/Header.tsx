import React from 'react';
import { User } from '../types';
import { authApi, slackApi } from '../services/api';
import { Activity, LogOut, MessageSquare, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  slackConnected: boolean;
  onRefreshUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, slackConnected, onRefreshUser }) => {
  const handleGoogleLogin = async () => {
    try {
      const url = await authApi.getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      alert('Google OAuth not configured in backend .env yet');
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
    authApi.logout();
    window.location.reload();
  };

  return (
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
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
