'use client';

import { useEffect, useState } from 'react';
import { X, Timer, ChevronUp, ChevronDown, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTimerStore } from '@/store/timerStore';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FloatingTimer() {
  const { isRunning, taskTitle, durationMs, stopTimer, getRemainingMs } = useTimerStore();

  const [remainingMs, setRemainingMs] = useState(0);
  const [minimized,   setMinimized]   = useState(false);
  const [expired,     setExpired]     = useState(false);

  // Tick every second while running
  useEffect(() => {
    if (!isRunning) {
      setExpired(false);
      return;
    }
    setExpired(false);

    const tick = () => {
      const rem = getRemainingMs();
      setRemainingMs(rem);
      if (rem === 0) {
        setExpired(true);
        // Browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("Time's up! 🎉", {
            body: `Timer for "${taskTitle}" has ended.`,
          });
        }
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, getRemainingMs, taskTitle]);

  // Request notification permission once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const progress = durationMs && durationMs > 0
    ? Math.min(((durationMs - remainingMs) / durationMs) * 100, 100)
    : 0;

  const isWarning = !expired && remainingMs > 0 && remainingMs < 60_000;

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed bottom-6 right-6 z-[300] select-none"
          style={{ width: 260 }}
        >
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: '#1A1D2E',
              borderColor: expired   ? '#FF4757'
                         : isWarning ? 'rgba(255,165,2,0.6)'
                         :             'rgba(83,82,237,0.45)',
              boxShadow: expired
                ? '0 0 28px rgba(255,71,87,0.35), 0 8px 32px rgba(0,0,0,0.6)'
                : '0 0 28px rgba(83,82,237,0.25), 0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{
                background: expired
                  ? 'linear-gradient(to right, rgba(255,71,87,0.18), rgba(255,71,87,0.06))'
                  : 'linear-gradient(to right, rgba(83,82,237,0.18), rgba(30,144,255,0.08))',
              }}
            >
              <Timer
                className="h-4 w-4 shrink-0"
                style={{ color: expired ? '#FF4757' : '#5352ED' }}
              />
              <span className="flex-1 text-xs font-semibold text-white/70 truncate">{taskTitle}</span>

              <button
                onClick={() => setMinimized((v) => !v)}
                className="text-white/30 hover:text-white/70 transition-colors p-0.5"
                aria-label={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={stopTimer}
                className="text-white/30 hover:text-[#FF4757] transition-colors p-0.5"
                aria-label="Close timer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ── Minimized strip ──────────────────────────────────────────── */}
            {minimized && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span
                  className="text-xl font-black tabular-nums"
                  style={{
                    color: expired ? '#FF4757' : isWarning ? '#FFA502' : '#fff',
                    textShadow: isWarning || expired ? '0 0 16px currentColor' : 'none',
                  }}
                >
                  {expired ? "Time's up!" : formatTime(remainingMs)}
                </span>
                {expired && (
                  <button
                    onClick={stopTimer}
                    className="px-3 py-1 rounded-full text-xs font-bold text-white ml-3"
                    style={{ background: 'linear-gradient(to right, #2ED573, #1E90FF)' }}
                  >
                    Done ✓
                  </button>
                )}
              </div>
            )}

            {/* ── Full body ────────────────────────────────────────────────── */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-4">
                    {expired ? (
                      /* ── Expired state ─────────────────────────────────── */
                      <div className="text-center">
                        <p className="text-3xl mb-2">🎉</p>
                        <p
                          className="text-xl font-black mb-1"
                          style={{ color: '#FF4757' }}
                        >
                          Time&apos;s Up!
                        </p>
                        <p className="text-xs text-white/40 mb-4">
                          Great work staying focused!
                        </p>
                        <button
                          onClick={stopTimer}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85"
                          style={{ background: 'linear-gradient(to right, #2ED573, #1E90FF)' }}
                        >
                          Done ✓
                        </button>
                      </div>
                    ) : (
                      /* ── Countdown state ───────────────────────────────── */
                      <>
                        {/* Big time display */}
                        <p
                          className="text-center text-5xl font-black tabular-nums mb-4 leading-none"
                          style={{
                            color: isWarning ? '#FFA502' : '#fff',
                            textShadow: isWarning ? '0 0 24px rgba(255,165,2,0.6)' : 'none',
                          }}
                        >
                          {formatTime(remainingMs)}
                        </p>

                        {/* Progress bar */}
                        <div className="h-2.5 rounded-full overflow-hidden bg-white/[0.07] mb-4">
                          <motion.div
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'linear' }}
                            className="h-full rounded-full"
                            style={{
                              background: isWarning
                                ? 'linear-gradient(to right, #FF4757, #FFA502)'
                                : 'linear-gradient(to right, #5352ED, #1E90FF)',
                              boxShadow: isWarning
                                ? '0 0 10px rgba(255,165,2,0.6)'
                                : '0 0 10px rgba(83,82,237,0.6)',
                            }}
                          />
                        </div>

                        {isWarning && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.4 }}
                            className="text-center text-xs font-bold mb-3"
                            style={{ color: '#FFA502' }}
                          >
                            Less than a minute left!
                          </motion.p>
                        )}

                        <button
                          onClick={stopTimer}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold
                            border border-white/[0.08] text-white/35 hover:text-white/65 hover:border-white/20 transition-all"
                        >
                          <Square className="h-3 w-3" />
                          Stop Timer
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
