import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealth('error'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-950">
      {/* Logo / Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-indigo-500/30">
          R
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ReachInbox</h1>
        <p className="text-gray-400 text-sm">AI-powered email scheduler</p>
      </div>

      {/* Health status card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl min-w-[260px]">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          Backend status
        </p>
        {health === 'checking' && (
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
            <span className="font-medium">Checking…</span>
          </div>
        )}
        {health === 'ok' && (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="font-medium">API reachable — status: ok</span>
          </div>
        )}
        {health === 'error' && (
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span className="font-medium">API unreachable</span>
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs">Level 1 — Project Setup</p>
    </div>
  );
}

export default App;
