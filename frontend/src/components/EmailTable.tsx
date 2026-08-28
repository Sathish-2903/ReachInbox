import React from 'react';
import { EmailItem, TabType } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
} from 'lucide-react';

interface EmailTableProps {
  activeTab: TabType;
  emails: EmailItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onComposeClick: () => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  activeTab,
  emails,
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onComposeClick,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Sent
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Scheduled
          </span>
        );
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Search & Actions Bar */}
      <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/60">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by recipient, subject, body..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-gray-950/60 text-gray-400 uppercase tracking-wider text-[10px] font-semibold border-b border-gray-800">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject</th>
              <th className="px-6 py-3.5">{activeTab === 'scheduled' ? 'Scheduled At' : 'Sent At'}</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/60 font-medium">
            {loading && emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading {activeTab} emails...</span>
                  </div>
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-500">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300">No {activeTab} emails found</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {searchQuery ? 'Try adjusting your search query' : 'Schedule your first outreach campaign'}
                      </p>
                    </div>
                    {!searchQuery && (
                      <button
                        onClick={onComposeClick}
                        className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all"
                      >
                        Compose Outreach
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  className="hover:bg-gray-800/40 transition-colors group cursor-default"
                >
                  <td className="px-6 py-4 text-white font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-indigo-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span>{email.recipient}</span>
                  </td>
                  <td className="px-6 py-4 max-w-md truncate text-gray-300">
                    {email.subject}
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                    {formatDate(activeTab === 'scheduled' ? email.scheduledAt : email.sentAt || email.scheduledAt)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(email.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
