'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ArchiveX, Undo2, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToastMode =
  | { type: 'confirm-single'; label: string; warning: string | null; onConfirm: () => void; onKeep: () => void }
  | { type: 'confirm-bulk';   count: number; category: string;        onConfirm: () => void; onKeep: () => void }
  | { type: 'undo';           label: string; onUndo: () => void; onExpire: () => void };

interface DeleteToastProps {
  mode: ToastMode | null;
  onDismiss: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DeleteToast({ mode, onDismiss }: DeleteToastProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!mode) return;

    const duration = mode.type === 'undo' ? 10 : 5;
    remainingRef.current = duration;
    setSecondsLeft(duration);

    timerRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setSecondsLeft(remainingRef.current);

      if (remainingRef.current <= 0) {
        clearInterval(timerRef.current!);
        // Defer parent setState out of this interval tick so React never
        // sees it as a setState-inside-setState-updater violation.
        if (mode.type === 'confirm-single' || mode.type === 'confirm-bulk') {
          setTimeout(onDismiss, 0);
        }
        if (mode.type === 'undo') {
          mode.onExpire();
          setTimeout(onDismiss, 0);
        }
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const isUndo    = mode?.type === 'undo';
  const totalSecs = mode?.type === 'undo' ? 10 : 5;
  const progress  = secondsLeft / totalSecs;

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-8 left-1/2 z-[400] w-[420px] max-w-[calc(100vw-32px)]"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{
              background: '#1A1D2E',
              borderColor: isUndo ? 'rgba(46,213,115,0.35)' : 'rgba(255,71,87,0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Coloured left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: isUndo ? '#2ED573' : '#FF4757' }}
            />

            {/* Countdown progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.06]">
              <motion.div
                className="h-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                style={{ background: isUndo ? '#2ED573' : '#FF4757' }}
              />
            </div>

            <div className="px-5 py-4 pl-6">
              {/* ── Confirm Single ─────────────────────────────────────────── */}
              {mode.type === 'confirm-single' && (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Delete this email?
                      </p>
                      <p className="text-xs text-white/50 mt-0.5 leading-snug">
                        {mode.label} · Moves to Gmail trash
                      </p>
                      {mode.warning && (
                        <p className="mt-2 text-xs font-medium px-2.5 py-1.5 rounded-lg leading-snug"
                          style={{ background: 'rgba(255,165,2,0.1)', color: '#FFA502' }}>
                          ⚠ {mode.warning}
                        </p>
                      )}
                    </div>
                    <button onClick={onDismiss} className="text-white/25 hover:text-white/60 shrink-0 mt-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { mode.onConfirm(); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-80"
                      style={{ background: '#FF4757' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                    <button
                      onClick={() => { mode.onKeep(); onDismiss(); }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50
                        border border-white/[0.08] hover:text-white/80 hover:border-white/20 transition-all"
                    >
                      Keep ({secondsLeft}s)
                    </button>
                  </div>
                </>
              )}

              {/* ── Confirm Bulk ───────────────────────────────────────────── */}
              {mode.type === 'confirm-bulk' && (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Delete {mode.count} {mode.category} email{mode.count !== 1 ? 's' : ''}?
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        They&apos;ll move to trash in Gmail.
                      </p>
                    </div>
                    <button onClick={onDismiss} className="text-white/25 hover:text-white/60 shrink-0 mt-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { mode.onConfirm(); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-80"
                      style={{ background: '#FF4757' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete All
                    </button>
                    <button
                      onClick={() => { mode.onKeep(); onDismiss(); }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50
                        border border-white/[0.08] hover:text-white/80 hover:border-white/20 transition-all"
                    >
                      Cancel ({secondsLeft}s)
                    </button>
                  </div>
                </>
              )}

              {/* ── Undo ──────────────────────────────────────────────────── */}
              {mode.type === 'undo' && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2ED573' }}>Deleted</p>
                    <p className="text-xs text-white/45 mt-0.5 truncate max-w-[240px]">{mode.label}</p>
                  </div>
                  <button
                    onClick={() => { mode.onUndo(); onDismiss(); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(46,213,115,0.2)', color: '#2ED573', border: '1px solid rgba(46,213,115,0.3)' }}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Undo ({secondsLeft}s)
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
