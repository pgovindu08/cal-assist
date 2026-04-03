'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Trash2, Inbox, Archive, Paperclip, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEmailStore } from '@/store/emailStore';
import type { Email, EmailCategory } from '@/store/emailStore';
import { api } from '@/lib/api';
import { DeleteToast } from './DeleteToast';
import type { ToastMode } from './DeleteToast';
import { cn } from '@/lib/utils';

// ── Config ─────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: EmailCategory[] = ['Urgent', 'Needs Reply', 'Informational', 'Newsletter', 'Promotion'];
const BULK_DELETABLE: EmailCategory[] = ['Newsletter', 'Promotion'];

const CATEGORY_COLORS: Record<EmailCategory, string> = {
  'Urgent':        '#FF4757',
  'Needs Reply':   '#1E90FF',
  'Informational': '#FFA502',
  'Newsletter':    '#5352ED',
  'Promotion':     '#2ED573',
};

const CATEGORY_EMOJI: Record<EmailCategory, string> = {
  'Urgent':        '🚨',
  'Needs Reply':   '💬',
  'Informational': 'ℹ️',
  'Newsletter':    '📰',
  'Promotion':     '🎁',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupEmails(emails: Email[]): Map<EmailCategory, Email[]> {
  const map = new Map<EmailCategory, Email[]>(CATEGORY_ORDER.map((c) => [c, []]));
  for (const e of emails) map.get(e.category ?? 'Informational')!.push(e);
  return map;
}

function parseSenderName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*<?/);
  return match ? match[1].trim() : from;
}

function buildDeleteWarning(email: Email): string | null {
  if (!email.isImportant) return null;
  return email.importantReason ?? 'This email might be important.';
}

// ── Compact email cell ─────────────────────────────────────────────────────────

function EmailCell({
  email,
  onDelete,
  onArchive,
}: {
  email: Email;
  onDelete: (email: Email) => void;
  onArchive: (email: Email) => void;
}) {
  const sender = parseSenderName(email.from);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="group relative flex flex-col gap-0.5 px-3 py-2.5 rounded-lg
        hover:bg-white/[0.04] transition-colors cursor-default min-w-0"
    >
      {/* Sender */}
      <span className="text-[11px] font-semibold text-white/60 truncate">{sender}</span>

      {/* Subject */}
      <span className="text-sm font-medium text-white truncate leading-snug">{email.subject}</span>

      {/* Summary / snippet */}
      <span className="text-[11px] text-white/35 truncate">
        {email.summary ?? email.snippet}
      </span>

      {/* Badges row */}
      {(email.hasAttachment || email.isImportant) && (
        <div className="flex items-center gap-2 mt-0.5">
          {email.hasAttachment && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/25">
              <Paperclip className="h-2.5 w-2.5" /> attachment
            </span>
          )}
          {email.isImportant && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: '#FFA502' }}>
              <AlertTriangle className="h-2.5 w-2.5" /> important
            </span>
          )}
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5
        opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onArchive(email)}
          title="Archive"
          className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(email)}
          title="Delete"
          className="p-1.5 rounded-lg text-white/25 hover:text-[#FF4757] hover:bg-[#FF4757]/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Flat email row (pre-summarize) ─────────────────────────────────────────────

function FlatEmailRow({ email, onDelete, onArchive }: {
  email: Email;
  onDelete: (e: Email) => void;
  onArchive: (e: Email) => void;
}) {
  const sender = parseSenderName(email.from);
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-4 px-4 py-3 border-b border-white/[0.04]
        hover:bg-white/[0.03] transition-colors"
    >
      <span className="w-36 shrink-0 text-xs font-semibold text-white/50 truncate">{sender}</span>
      <span className="flex-1 text-sm text-white truncate">{email.subject}</span>
      <span className="w-56 shrink-0 text-xs text-white/30 truncate hidden lg:block">
        {email.snippet}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onArchive(email)} className="p-1.5 rounded text-white/25 hover:text-white/70 transition-colors">
          <Archive className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(email)} className="p-1.5 rounded text-white/25 hover:text-[#FF4757] transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function InboxView() {
  const {
    emails, isFetching, isSummarizing, summarized,
    fetchInbox, summarizeAll, removeEmail, restoreEmail,
  } = useEmailStore();

  const [toast, setToast] = useState<ToastMode | null>(null);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // ── Single delete ────────────────────────────────────────────────────────────

  const requestDelete = useCallback((email: Email) => {
    const warning = buildDeleteWarning(email);
    const label   = email.subject.slice(0, 50) + (email.subject.length > 50 ? '…' : '');
    setToast({
      type: 'confirm-single', label, warning, onKeep: () => {},
      onConfirm: () => {
        removeEmail(email.id);
        api.post(`/email/trash/${email.id}`).catch(() => restoreEmail(email));
        setToast({
          type: 'undo', label, onExpire: () => {},
          onUndo: async () => {
            restoreEmail(email);
            try { await api.post(`/email/untrash/${email.id}`); } catch { /* ignore */ }
          },
        });
      },
    });
  }, [removeEmail, restoreEmail]);

  // ── Archive ──────────────────────────────────────────────────────────────────

  const handleArchive = useCallback((email: Email) => {
    removeEmail(email.id);
    api.post(`/email/archive/${email.id}`).catch(() => restoreEmail(email));
  }, [removeEmail, restoreEmail]);

  // ── Bulk delete (per category) ───────────────────────────────────────────────

  const requestBulkDelete = useCallback((category: EmailCategory, catEmails: Email[]) => {
    setToast({
      type: 'confirm-bulk', count: catEmails.length, category, onKeep: () => {},
      onConfirm: () => {
        const ids = catEmails.map((e) => e.id);
        ids.forEach((id) => removeEmail(id));
        api.post('/email/batch-trash', { ids }).catch(() => catEmails.forEach((e) => restoreEmail(e)));
        setToast({
          type: 'undo', label: `${catEmails.length} ${category} emails`, onExpire: () => {},
          onUndo: async () => {
            catEmails.forEach((e) => restoreEmail(e));
            await Promise.allSettled(ids.map((id) => api.post(`/email/untrash/${id}`)));
          },
        });
      },
    });
  }, [removeEmail, restoreEmail]);

  // ── Delete all ───────────────────────────────────────────────────────────────

  const requestDeleteAll = useCallback(() => {
    if (!emails.length) return;
    const snapshot = [...emails];
    setToast({
      type: 'confirm-bulk', count: snapshot.length, category: 'unread', onKeep: () => {},
      onConfirm: () => {
        const ids = snapshot.map((e) => e.id);
        ids.forEach((id) => removeEmail(id));
        api.post('/email/batch-trash', { ids }).catch(() => snapshot.forEach((e) => restoreEmail(e)));
        setToast({
          type: 'undo', label: `${snapshot.length} emails`, onExpire: () => {},
          onUndo: async () => {
            snapshot.forEach((e) => restoreEmail(e));
            await Promise.allSettled(ids.map((id) => api.post(`/email/untrash/${id}`)));
          },
        });
      },
    });
  }, [emails, removeEmail, restoreEmail]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const grouped    = groupEmails(emails);
  const totalCount = emails.length;
  const maxRows    = Math.max(...CATEGORY_ORDER.map((c) => grouped.get(c)!.length), 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: '#0F1117' }}>

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-b border-white/[0.05] px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(15,17,23,0.97)' }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1E90FF, #5352ED)' }}>
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Email Hub</h1>
            <p className="text-[11px] text-white/40 mt-0.5">
              {isFetching ? 'Loading…' : `${totalCount} unread`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => fetchInbox()} disabled={isFetching}
            className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => summarizeAll()}
            disabled={isSummarizing || isFetching || totalCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white
              transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(to right, #5352ED, #1E90FF)' }}
          >
            {isSummarizing
              ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Summarizing…</>
              : <><Sparkles className="h-4 w-4" />{summarized ? 'Re-summarize' : 'Summarize All'}</>
            }
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* Loading */}
        {isFetching && (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#5352ED', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* Empty */}
        {!isFetching && totalCount === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">📭</div>
            <p className="text-white/50 font-semibold">Inbox zero — you&apos;re all caught up!</p>
            <button onClick={() => fetchInbox()} className="text-xs text-white/30 hover:text-white/60 transition-colors">Refresh</button>
          </div>
        )}

        {/* Pre-summarize flat list */}
        {!isFetching && !summarized && totalCount > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 border-b border-white/[0.05]">
              <p className="text-xs text-white/30">
                {totalCount} unread — hit <span className="text-[#5352ED] font-semibold">Summarize All</span> to categorize with AI.
              </p>
            </div>
            <AnimatePresence mode="popLayout">
              {emails.map((email) => (
                <FlatEmailRow key={email.id} email={email} onDelete={requestDelete} onArchive={handleArchive} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Table grid view after summarize ─────────────────────────────── */}
        {!isFetching && summarized && (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse" style={{ minWidth: 900 }}>

              {/* Sticky category header row */}
              <thead className="sticky top-0 z-10" style={{ background: 'rgba(15,17,23,0.97)' }}>
                <tr>
                  {CATEGORY_ORDER.map((category, i) => {
                    const color    = CATEGORY_COLORS[category];
                    const emoji    = CATEGORY_EMOJI[category];
                    const canBulk  = BULK_DELETABLE.includes(category);
                    const catCount = grouped.get(category)!.length;
                    const isLast   = i === CATEGORY_ORDER.length - 1;

                    return (
                      <th
                        key={category}
                        className="text-left px-4 py-3 font-normal"
                        style={{
                          width: '20%',
                          borderBottom: `2px solid ${color}`,
                          borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base leading-none shrink-0">{emoji}</span>
                            <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color }}>
                              {category}
                            </span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ color, background: `${color}18` }}
                            >
                              {catCount}
                            </span>
                          </div>
                          {canBulk && catCount > 0 && (
                            <button
                              onClick={() => requestBulkDelete(category, grouped.get(category)!)}
                              title={`Clear all ${category}`}
                              className="p-1 rounded text-white/20 hover:text-[#FF4757] hover:bg-[#FF4757]/10 transition-colors shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Email rows */}
              <tbody>
                {maxRows === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-white/25 text-sm">
                      All emails cleared ✓
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: maxRows }).map((_, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors"
                    >
                      {CATEGORY_ORDER.map((category, colIdx) => {
                        const email  = grouped.get(category)?.[rowIdx] ?? null;
                        const isLast = colIdx === CATEGORY_ORDER.length - 1;

                        return (
                          <td
                            key={category}
                            className="align-top p-0"
                            style={{
                              borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              width: '20%',
                            }}
                          >
                            {email ? (
                              <AnimatePresence mode="popLayout">
                                <EmailCell
                                  key={email.id}
                                  email={email}
                                  onDelete={requestDelete}
                                  onArchive={handleArchive}
                                />
                              </AnimatePresence>
                            ) : (
                              <div className="h-16" /> // empty cell spacer
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete All footer ───────────────────────────────────────────────── */}
      {!isFetching && totalCount > 0 && (
        <div
          className="shrink-0 border-t border-white/[0.05] px-6 py-3 flex items-center justify-between"
          style={{ background: 'rgba(15,17,23,0.95)' }}
        >
          <p className="text-xs text-white/30">
            {totalCount} unread email{totalCount !== 1 ? 's' : ''} in inbox
          </p>
          <button
            onClick={requestDeleteAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
              border transition-all hover:bg-[#FF4757]/10"
            style={{ color: '#FF4757', borderColor: 'rgba(255,71,87,0.3)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete All ({totalCount})
          </button>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <DeleteToast mode={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
