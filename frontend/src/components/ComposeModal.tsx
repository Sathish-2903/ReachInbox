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
  Sparkles,
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

    if (!subject.trim()) {
      setError('Please provide an email subject');
      return;
    }
    if (!body.trim()) {
      setError('Please provide email body content');
      return;
    }
    if (parsedRecipients.length === 0) {
      setError('Please provide at least one valid recipient email');
      return;
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compose New Outreach</h2>
              <p className="text-xs text-gray-400">Schedule automated email dispatch with BullMQ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question about your outreach strategy..."
              className="w-full px-3.5 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Recipients Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Recipients ({parsedRecipients.length} Ready)
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV / TXT</span>
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
              className="w-full px-3.5 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />

            {/* Upload Stats / Chips */}
            {uploadStats && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                  Detected: {uploadStats.detected}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
                  Valid: {uploadStats.valid} ({uploadStats.unique} Unique)
                </span>
                {uploadStats.invalid > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 font-medium">
                    Invalid: {uploadStats.invalid}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Email Body (HTML / Plain text)
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{name}},&#10;&#10;I came across your work and wanted to reach out..."
              className="w-full px-3.5 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Scheduling Configuration */}
          <div className="p-4 bg-gray-800/40 border border-gray-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Dispatch Timing
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('now')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    scheduleType === 'now'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Immediate (Now)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('custom')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    scheduleType === 'custom'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Schedule Later
                </button>
              </div>
            </div>

            {scheduleType === 'custom' && (
              <div>
                <input
                  type="datetime-local"
                  required
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Rate & Delay Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  Min Delay Between Emails
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={delayBetweenEmails}
                    onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono"
                  />
                  <span className="text-xs text-gray-400">ms</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-indigo-400" />
                  Hourly Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono"
                  />
                  <span className="text-xs text-gray-400">/hr</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-900/90 border-t border-gray-800 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {parsedRecipients.length > 0
              ? `${parsedRecipients.length} job(s) will be added to BullMQ`
              : 'Add recipients to proceed'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || parsedRecipients.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scheduling...</span>
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
