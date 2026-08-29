import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { EmailTable } from '../components/EmailTable.tsx';
import { ComposeModal } from '../components/ComposeModal.tsx';
import { emailApi, slackApi } from '../services/api.ts';
import { EmailItem, TabType } from '../types/index.ts';
import {
  Send,
  Clock,
  CheckCircle,
  Plus,
  Activity,
  CalendarCheck,
  Shield,
  Radar,
  MessageSquare,
} from 'lucide-react';

export function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [slackConnected, setSlackConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const fetchUserAndSlack = useCallback(async () => {
    refreshUser();
    try {
      const slackRes = await slackApi.getStatus();
      setSlackConnected(slackRes.connected);
    } catch (err) {
      console.error('Error fetching slack status:', err);
    }
  }, [refreshUser]);

  useEffect(() => {
    fetchUserAndSlack();
  }, [fetchUserAndSlack]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const searchResults = await emailApi.search(searchQuery);
        setEmails(searchResults);
      } else {
        const [scheduledRes, sentRes] = await Promise.all([
          emailApi.getScheduled(1, 50),
          emailApi.getSent(1, 50),
        ]);

        setScheduledCount(scheduledRes.total);
        setSentCount(sentRes.total);

        if (activeTab === 'scheduled') {
          setEmails(scheduledRes.items);
        } else {
          setEmails(sentRes.items);
        }
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  const featureCards = [
    {
      icon: CalendarCheck,
      color: 'var(--teal)',
      colorMuted: 'var(--teal-muted)',
      colorBorder: 'var(--teal-border)',
      title: 'Smart Scheduling',
      desc: 'Schedule emails for the right time automatically.',
    },
    {
      icon: Shield,
      color: 'var(--blue)',
      colorMuted: 'var(--blue-muted)',
      colorBorder: 'var(--blue-border)',
      title: 'Rate Limit Protection',
      desc: 'Automatically control sending limits to protect your domain.',
    },
    {
      icon: Radar,
      color: 'var(--success)',
      colorMuted: 'var(--success-muted)',
      colorBorder: 'var(--success-border)',
      title: 'Delivery Tracking',
      desc: 'Monitor email delivery, opens and replies in real time.',
    },
    {
      icon: MessageSquare,
      color: 'var(--warning)',
      colorMuted: 'var(--warning-muted)',
      colorBorder: 'var(--warning-border)',
      title: 'Slack Notifications',
      desc: 'Get notified in Slack when important events occur.',
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Fixed Sidebar */}
      <Sidebar onQueueBoardClick={() => window.open('/admin/queues', '_blank')} />

      {/* Fixed Header */}
      <Header user={user} slackConnected={slackConnected} onRefreshUser={fetchUserAndSlack} />

      {/* Main — offset for sidebar (224px) and header (~64px) */}
      <main
        className="min-h-screen"
        style={{ paddingLeft: '224px', paddingTop: '64px' }}
      >
        <div className="px-8 py-7 space-y-7 max-w-6xl">

          {/* ── Stat Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Scheduled */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Scheduled Emails
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {scheduledCount}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--warning-muted)', border: '1px solid var(--warning-border)' }}>
                  <Clock className="w-4.5 h-4.5" style={{ color: 'var(--warning)' }} />
                </div>
              </div>
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--warning)' }} />
                Awaiting delayed trigger
              </p>
            </div>

            {/* Delivered */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--success-border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Delivered Emails
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{sentCount}</p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--success-muted)', border: '1px solid var(--success-border)' }}>
                  <CheckCircle className="w-4.5 h-4.5" style={{ color: 'var(--success)' }} />
                </div>
              </div>
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
                Dispatched via Ethereal SMTP
              </p>
            </div>

            {/* Total */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Total Emails Sent
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {scheduledCount + sentCount}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal-border)' }}>
                  <Send className="w-4.5 h-4.5" style={{ color: 'var(--teal)' }} />
                </div>
              </div>
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--teal)' }} />
                All campaigns combined
              </p>
            </div>

            {/* Queue System */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue-border)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Queue System
                  </p>
                  <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>BullMQ + Redis</p>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{ background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid var(--success-border)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Active
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--blue-muted)', border: '1px solid var(--blue-border)' }}>
                  <Activity className="w-4.5 h-4.5" style={{ color: 'var(--blue)' }} />
                </div>
              </div>
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
                Elasticsearch 8 sync online
              </p>
            </div>
          </div>

          {/* ── Email Section ─────────────────────────────────────────── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Section header */}
            <div
              className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {/* Tabs */}
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => { setActiveTab('scheduled'); setSearchQuery(''); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === 'scheduled' ? 'var(--teal)' : 'transparent',
                    color: activeTab === 'scheduled' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      background: activeTab === 'scheduled' ? 'rgba(0,0,0,0.2)' : 'var(--bg-card)',
                      color: activeTab === 'scheduled' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {scheduledCount}
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('sent'); setSearchQuery(''); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === 'sent' ? 'var(--teal)' : 'transparent',
                    color: activeTab === 'sent' ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Sent
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      background: activeTab === 'sent' ? 'rgba(0,0,0,0.2)' : 'var(--bg-card)',
                      color: activeTab === 'sent' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {sentCount}
                  </span>
                </button>
              </div>

              {/* Compose button */}
              <button
                onClick={() => setIsComposeOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors flex-shrink-0"
                style={{ background: 'var(--teal)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal)'}
              >
                <Plus className="w-3.5 h-3.5" />
                Compose Email
              </button>
            </div>

            {/* Table */}
            <EmailTable
              activeTab={activeTab}
              emails={emails}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={fetchEmails}
              onComposeClick={() => setIsComposeOpen(true)}
            />
          </div>

          {/* ── Feature Cards ────────────────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              How ReachInbox helps you
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {featureCards.map(({ icon: Icon, color, colorMuted, colorBorder, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: colorMuted, border: `1px solid ${colorBorder}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => { fetchEmails(); }}
      />
    </div>
  );
}

export default Dashboard;
