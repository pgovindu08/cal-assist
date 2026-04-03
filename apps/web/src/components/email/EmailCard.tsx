'use client';

import { Archive, Trash2, Paperclip, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Email, EmailCategory } from '@/store/emailStore';

// ── helpers ────────────────────────────────────────────────────────────────────

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400_000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORY_COLORS: Record<EmailCategory, string> = {
  'Urgent':       '#FF4757',
  'Needs Reply':  '#1E90FF',
  'Informational':'#FFA502',
  'Newsletter':   '#5352ED',
  'Promotion':    '#2ED573',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function EmailCard({
  email,
  showCategory = false,
  onDelete,
  onArchive,
}: {
  email: Email;
  showCategory?: boolean;
  onDelete: (email: Email) => void;
  onArchive: (email: Email) => void;
}) {
  const sender    = parseSender(email.from);
  const dateLabel = formatDate(email.date);
  const catColor  = email.category ? CATEGORY_COLORS[email.category] : '#5352ED';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="group relative flex items-start gap-3 rounded-xl border border-white/[0.07]
        bg-[#1A1D2E] px-4 py-3.5 hover:border-white/[0.14] transition-all duration-200"
    >
      {/* Sender avatar */}
      <div
        className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-sm font-black text-white mt-0.5"
        style={{ background: `${catColor}25`, border: `1.5px solid ${catColor}40` }}
      >
        {sender.name.charAt(0).toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pr-16">
        {/* Row 1: sender + date */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white/80 truncate">{sender.name}</span>
          <span className="text-[10px] text-white/30 shrink-0">{dateLabel}</span>
        </div>

        {/* Row 2: subject */}
        <p className="text-sm font-medium text-white truncate leading-snug">{email.subject}</p>

        {/* Row 3: AI summary or snippet */}
        <p className="text-xs text-white/40 mt-0.5 line-clamp-1 leading-relaxed">
          {email.summary ?? email.snippet}
        </p>

        {/* Row 4: badges */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {showCategory && email.category && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: catColor, background: `${catColor}18` }}
            >
              {email.category}
            </span>
          )}
          {email.hasAttachment && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/30">
              <Paperclip className="h-3 w-3" /> Attachment
            </span>
          )}
          {email.isImportant && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: '#FFA502' }}>
              <AlertTriangle className="h-3 w-3" />
              {email.importantReason ?? 'Might be important'}
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1
        opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => { e.stopPropagation(); onArchive(email); }}
          title="Archive"
          className={cn(
            'p-2 rounded-lg transition-colors',
            'text-white/25 hover:text-white/70 hover:bg-white/[0.06]',
          )}
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(email); }}
          title="Delete"
          className="p-2 rounded-lg transition-colors text-white/25 hover:text-[#FF4757] hover:bg-[#FF4757]/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
