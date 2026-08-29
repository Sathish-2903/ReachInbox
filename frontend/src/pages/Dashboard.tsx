import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header.tsx';
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

  // Fetch initial user & slack status
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

  // Load emails based on active tab and search query
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
    const interval = setInterval(fetchEmails, 5000); // 5s polling for real-time queue updates
    return () => clearInterval(interval);
  }, [fetchEmails]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        slackConnected={slackConnected}
        onRefreshUser={fetchUserAndSlack}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Hero / Stat Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Scheduled */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Queue</p>
                <h3 className="text-3xl font-black text-white mt-1">{scheduledCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Awaiting BullMQ delayed trigger
            </p>
          </div>

          {/* Card 2: Sent */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivered Emails</p>
                <h3 className="text-3xl font-black text-white mt-1">{sentCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Dispatched via Ethereal SMTP
            </p>
          </div>

          {/* Card 3: Engine Health */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Queue System</p>
                <h3 className="text-lg font-bold text-white mt-2 flex items-center gap-2">
                  <span>BullMQ + Redis</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-md">
                    Active
                  </span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Elasticsearch 8 sync online
            </p>
          </div>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tab buttons */}
          <div className="flex items-center p-1 bg-gray-900 border border-gray-800 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled Emails</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">
                {scheduledCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sent');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'sent'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sent Emails</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">
                {sentCount}
              </span>
            </button>
          </div>

          {/* Compose CTA Button */}
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Compose New Email</span>
          </button>
        </div>

        {/* Email Table */}
        <EmailTable
          activeTab={activeTab}
          emails={emails}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={fetchEmails}
          onComposeClick={() => setIsComposeOpen(true)}
        />
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          fetchEmails();
        }}
      />
    </div>
  );
}
export default Dashboard;
