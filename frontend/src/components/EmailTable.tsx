import React from 'react';
import { EmailItem, TabType } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Plus,
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
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--success-muted)',
              color: 'var(--success)',
              border: '1px solid var(--success-border)',
            }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Sent
          </span>
        );
      case 'PROCESSING':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--blue-muted)',
              color: 'var(--blue)',
              border: '1px solid var(--blue-border)',
            }}
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--danger-muted)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--warning-muted)',
              color: 'var(--warning)',
              border: '1px solid var(--warning-border)',
            }}
          >
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
    <>
      {/* Search & Filters Bar */}
      <div
        className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}
      >
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by recipient, subject, body..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--teal)'}
            onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              style={{ color: loading ? 'var(--teal)' : undefined }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead style={{ borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Recipient', 'Subject', activeTab === 'scheduled' ? 'Scheduled At' : 'Sent At', 'Status'].map(h => (
                <th
                  key={h}
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'var(--teal)', borderTopColor: 'transparent' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Loading {activeTab} emails…
                    </span>
                  </div>
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
                    >
                      <Mail className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        No {activeTab} emails yet
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                          ? 'Try adjusting your search query'
                          : 'Create your first outreach campaign and schedule emails to send at the right time.'}
                      </p>
                    </div>
                    {!searchQuery && (
                      <button
                        onClick={onComposeClick}
                        className="flex items-center gap-1.5 mt-1 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
                        style={{ background: 'var(--teal)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal-hover)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal)'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Compose Email
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  className="transition-colors"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal-border)' }}
                      >
                        <Mail className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {email.recipient}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-5 py-3.5 max-w-xs truncate text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {email.subject}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[11px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatDate(activeTab === 'scheduled' ? email.scheduledAt : email.sentAt || email.scheduledAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    {getStatusBadge(email.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
