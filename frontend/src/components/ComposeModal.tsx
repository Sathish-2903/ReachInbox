import React, { useState, useRef } from 'react';
import { emailApi } from '../services/api';
import { UploadResult } from '../types';
import {
  X,
  Send,
  UploadCloud,
  Clock,
  Gauge,
  AlertCircle,
  Mail,
} from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [rawRecipientsText, setRawRecipientsText] = useState('');
  const [parsedRecipients, setParsedRecipients] = useState<string[]>([]);
  const [uploadStats, setUploadStats] = useState<UploadResult | null>(null);

  // Scheduling options
  const [scheduleType, setScheduleType] = useState<'now' | 'custom'>('now');
  const [customStartTime, setCustomStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const result = await emailApi.uploadFile(file);
      setUploadStats(result);
      setParsedRecipients(result.emails);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to parse CSV file');
    }
  };

  const handleTextChange = async (text: string) => {
    setRawRecipientsText(text);
    if (!text.trim()) {
      setUploadStats(null);
      setParsedRecipients([]);
      return;
    }

    try {
      const result = await emailApi.parseText(text);
      setUploadStats(result);
      setParsedRecipients(result.emails);
    } catch {
      // Ignore intermediate typing errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) { setError('Please provide an email subject'); return; }
    if (!body.trim())    { setError('Please provide email body content'); return; }
    if (parsedRecipients.length === 0) { setError('Please provide at least one valid recipient email'); return; }

    setLoading(true);
    try {
      const startTime =
        scheduleType === 'custom' && customStartTime
          ? new Date(customStartTime).toISOString()
          : new Date().toISOString();

      await emailApi.schedule({
        subject: subject.trim(),
        body: body.trim(),
        recipients: parsedRecipients,
        startTime,
        delayBetweenEmails: Number(delayBetweenEmails),
        hourlyLimit: Number(hourlyLimit),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input style ─── */
  const inputCls = "w-full rounded-lg text-sm outline-none transition-all px-3.5 py-2.5";
  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = 'var(--teal)');
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = 'var(--border)');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal-border)' }}
            >
              <Mail className="w-4 h-4" style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Compose New Outreach
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Schedule automated email dispatch with BullMQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-sidebar)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs"
              style={{
                background: 'var(--danger-muted)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question about your outreach strategy..."
              className={inputCls}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Recipients ({parsedRecipients.length} Ready)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--teal)' }}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload CSV / TXT
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              rows={3}
              value={rawRecipientsText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste comma-separated or one email per line: alice@example.com, bob@example.com"
              className={`${inputCls} font-mono`}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />

            {/* Upload Stats */}
            {uploadStats && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded font-medium"
                  style={{ background: 'var(--teal-muted)', border: '1px solid var(--teal-border)', color: 'var(--teal)' }}>
                  Detected: {uploadStats.detected}
                </span>
                <span className="px-2 py-0.5 rounded font-medium"
                  style={{ background: 'var(--success-muted)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
                  Valid: {uploadStats.valid} ({uploadStats.unique} Unique)
                </span>
                {uploadStats.invalid > 0 && (
                  <span className="px-2 py-0.5 rounded font-medium"
                    style={{ background: 'var(--danger-muted)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
                    Invalid: {uploadStats.invalid}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email Body (HTML / Plain text)
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi {{name}},\n\nI came across your work and wanted to reach out..."}
              className={`${inputCls} font-mono`}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>

          {/* Scheduling */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                Dispatch Timing
              </span>
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {(['now', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setScheduleType(t)}
                    className="px-3 py-1 text-xs rounded-md font-medium transition-all"
                    style={{
                      background: scheduleType === t ? 'var(--teal)' : 'transparent',
                      color: scheduleType === t ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {t === 'now' ? 'Immediate (Now)' : 'Schedule Later'}
                  </button>
                ))}
              </div>
            </div>

            {scheduleType === 'custom' && (
              <input
                type="datetime-local"
                required
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg text-sm outline-none"
                style={{ ...inputStyle }}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            )}

            {/* Rate / Delay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium mb-1 flex items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}>
                  <Clock className="w-3 h-3" style={{ color: 'var(--teal)' }} />
                  Min Delay Between Emails
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={delayBetweenEmails}
                    onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-mono outline-none"
                    style={inputStyle}
                  />
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>ms</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 flex items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}>
                  <Gauge className="w-3 h-3" style={{ color: 'var(--teal)' }} />
                  Hourly Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-mono outline-none"
                    style={inputStyle}
                  />
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>/hr</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {parsedRecipients.length > 0
              ? `${parsedRecipients.length} job(s) will be added to BullMQ`
              : 'Add recipients to proceed'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || parsedRecipients.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--teal)' }}
              onMouseEnter={e => {
                if (!loading && parsedRecipients.length > 0)
                  (e.currentTarget as HTMLElement).style.background = 'var(--teal-hover)';
              }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal)'}
            >
              {loading ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  <span>Scheduling…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Schedule Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
