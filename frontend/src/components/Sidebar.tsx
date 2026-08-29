import React from 'react';
import {
  LayoutDashboard,
  Mail,
  Send,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Plug,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  onQueueBoardClick: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Home',        active: true  },
  { icon: Send,            label: 'Campaigns',   active: false },
  { icon: Mail,            label: 'Emails',      active: false },
  { icon: FileText,        label: 'Templates',   active: false },
  { icon: Activity,        label: 'Queue Board', active: false, isQueueBoard: true },
  { icon: BarChart3,       label: 'Analytics',   active: false },
  { icon: Settings,        label: 'Settings',    active: false },
  { icon: Plug,            label: 'Integrations',active: false },
];

export const Sidebar: React.FC<SidebarProps> = ({ onQueueBoardClick }) => {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col z-20"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>

      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'var(--teal)' }}>
          R
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ReachInbox</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Outreach Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, active, isQueueBoard }) => (
          <button
            key={label}
            onClick={isQueueBoard ? onQueueBoardClick : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
            style={{
              background: active ? 'var(--teal-muted)' : 'transparent',
              color: active ? 'var(--teal)' : 'var(--text-secondary)',
              borderLeft: active ? '2px solid var(--teal)' : '2px solid transparent',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(36,50,68,0.6)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {isQueueBoard && (
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Dark Mode</span>
          </div>
          {/* Toggle — visual only, already dark */}
          <div className="w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer"
            style={{ background: 'var(--teal)' }}>
            <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
          </div>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>v1.0.0 · ReachInbox</p>
      </div>
    </aside>
  );
};
