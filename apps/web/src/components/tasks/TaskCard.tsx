'use client';

import { useEffect, useState } from 'react';
import { Trash2, Flame, Clock, Zap, ChevronDown, ChevronUp, Timer, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Task } from '@/store/taskStore';
import { useTaskStore } from '@/store/taskStore';
import { useTimerStore } from '@/store/timerStore';

export const XP_MAP = { LOW: 10, MEDIUM: 30, HIGH: 50 } as const;

const PRIORITY_CONFIG = {
  LOW:    { flames: 1, color: '#2ED573', label: 'Easy' },
  MEDIUM: { flames: 2, color: '#FFA502', label: 'Medium' },
  HIGH:   { flames: 3, color: '#FF4757', label: 'Hard' },
} as const;

const PRESETS = [
  { label: '5m',   minutes: 5 },
  { label: '15m',  minutes: 15 },
  { label: '25m 🍅', minutes: 25 },
  { label: '30m',  minutes: 30 },
  { label: '1h',   minutes: 60 },
];

function formatRelativeTime(dueDate: string | null) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const now  = new Date();
  const diffMs    = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const d = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return { label: `Overdue by ${d} day${d > 1 ? 's' : ''}`, isOverdue: true, isUrgent: true };
  }
  if (diffHours < 1)  return { label: `Due in ${Math.round(diffHours * 60)}m`, isOverdue: false, isUrgent: true };
  if (diffHours < 24) return { label: `Due in ${Math.round(diffHours)}h`,       isOverdue: false, isUrgent: diffHours < 6 };
  if (diffDays === 1) return { label: 'Due Tomorrow',                           isOverdue: false, isUrgent: false };
  return              { label: `Due in ${diffDays} days`,                       isOverdue: false, isUrgent: false };
}

function formatMs(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Live countdown inside the card (when this card's timer is running) ────────

function CardCountdown({ taskId }: { taskId: string }) {
  const { taskId: activeId, getRemainingMs, stopTimer } = useTimerStore();
  const [remaining, setRemaining] = useState(() => getRemainingMs());

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemainingMs()), 1000);
    return () => clearInterval(id);
  }, [getRemainingMs]);

  if (activeId !== taskId) return null;

  const isWarning = remaining > 0 && remaining < 60_000;

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
      <Timer className="h-3.5 w-3.5 shrink-0" style={{ color: isWarning ? '#FFA502' : 'var(--cal-secondary)' }} />
      <span
        className="text-sm font-black tabular-nums"
        style={{
          color: remaining === 0 ? '#FF4757' : isWarning ? '#FFA502' : '#fff',
          textShadow: isWarning ? '0 0 12px rgba(255,165,2,0.5)' : 'none',
        }}
      >
        {remaining === 0 ? "Time's up!" : formatMs(remaining)}
      </span>
      <button
        onClick={stopTimer}
        className="ml-auto flex items-center gap-1 text-[10px] text-white/30 hover:text-[#FF4757] transition-colors"
      >
        <Square className="h-3 w-3" /> Stop
      </button>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function TaskCard({
  task,
  onComplete,
  glowEffect = false,
}: {
  task: Task;
  onComplete?: (xp: number) => void;
  glowEffect?: boolean;
}) {
  const { updateTask, deleteTask } = useTaskStore();
  const { taskId: activeTimerTaskId, isRunning, startTimer } = useTimerStore();

  const [expanded,        setExpanded]        = useState(false);
  const [isUpdating,      setIsUpdating]      = useState(false);
  const [justCompleted,   setJustCompleted]   = useState(false);
  const [removing,        setRemoving]        = useState(false);
  const [showTimerInput,  setShowTimerInput]  = useState(false);
  const [timerMinutes,    setTimerMinutes]    = useState(25);

  const isDone          = task.status === 'DONE';
  const priority        = PRIORITY_CONFIG[task.priority];
  const xp              = XP_MAP[task.priority];
  const timeInfo        = formatRelativeTime(task.dueDate);
  const isThisTimerActive = isRunning && activeTimerTaskId === task.id;
  const otherTimerActive  = isRunning && activeTimerTaskId !== task.id;

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    if (!isDone) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
      await updateTask(task.id, { status: 'DONE' });
      onComplete?.(xp);
    } else {
      await updateTask(task.id, { status: 'TODO' });
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    setRemoving(true);
    await deleteTask(task.id);
  };

  const handleStartTimer = () => {
    startTimer(task.id, task.title, timerMinutes);
    setShowTimerInput(false);
  };

  return (
    <AnimatePresence>
      {!removing && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300',
            isDone
              ? 'opacity-40 bg-white/[0.02] border-white/5'
              : 'bg-[#1A1D2E] border-white/[0.08] hover:border-white/20',
            glowEffect && !isDone && 'shadow-[0_0_24px_rgba(255,71,87,0.2)] border-[#FF4757]/30',
            isThisTimerActive && !isDone && 'border-[var(--cal-secondary)]/50',
          )}
        >
          {/* XP badge */}
          {!isDone && (
            <div
              className="absolute top-3 right-8 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold pointer-events-none"
              style={{ color: 'var(--cal-secondary)', background: 'rgba(var(--cal-primary-rgb),0.12)' }}
            >
              <Zap className="h-3 w-3" />+{xp} XP
            </div>
          )}

          <div className="flex items-start gap-3 pr-8">
            {/* Animated checkbox */}
            <button
              onClick={handleToggle}
              disabled={isUpdating}
              className="mt-0.5 shrink-0 focus:outline-none"
              aria-label={isDone ? 'Mark incomplete' : 'Complete task'}
            >
              <motion.div
                animate={justCompleted ? { scale: [1, 1.7, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200',
                  isDone ? 'border-transparent bg-[#2ED573]' : 'border-white/30 hover:border-white/60',
                )}
              >
                {isDone && (
                  <motion.svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth={3} className="h-3 w-3">
                    <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
                  </motion.svg>
                )}
              </motion.div>
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium text-white leading-snug', isDone && 'line-through opacity-40')}>
                {task.title}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {/* Flames */}
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <Flame key={i} className="h-3 w-3"
                      style={{ color: i < priority.flames ? priority.color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>

                {/* Difficulty pill */}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: priority.color, background: `${priority.color}1A` }}>
                  {priority.label}
                </span>

                {/* Relative due time */}
                {timeInfo && (
                  <span className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: timeInfo.isOverdue ? '#FF4757' : timeInfo.isUrgent ? '#FFA502' : 'rgba(255,255,255,0.4)' }}>
                    <Clock className="h-3 w-3" />{timeInfo.label}
                  </span>
                )}
              </div>

              {/* Notes */}
              <AnimatePresence>
                {expanded && task.notes && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-xs text-white/35 whitespace-pre-wrap"
                  >
                    {task.notes}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Live countdown when this task's timer is running */}
              {isThisTimerActive && <CardCountdown taskId={task.id} />}
            </div>
          </div>

          {/* Hover actions — expand, timer, delete */}
          <div className="absolute top-3 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.notes && (
              <button onClick={() => setExpanded(!expanded)}
                className="p-1 rounded text-white/25 hover:text-white/60">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}

            {/* Timer toggle button — hidden when done */}
            {!isDone && (
              <button
                onClick={() => {
                  if (isThisTimerActive) return; // FloatingTimer handles stopping
                  setShowTimerInput((v) => !v);
                }}
                title={isThisTimerActive ? 'Timer running' : 'Set timer'}
                className={cn(
                  'p-1 rounded transition-colors',
                  isThisTimerActive ? 'text-[var(--cal-secondary)]' : 'text-white/25 hover:text-[var(--cal-secondary)]',
                )}
              >
                <Timer className="h-3.5 w-3.5" />
              </button>
            )}

            <button onClick={handleDelete}
              className="p-1 rounded text-white/25 hover:text-[#FF4757] transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Timer input panel ─────────────────────────────────────────── */}
          <AnimatePresence>
            {showTimerInput && !isThisTimerActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-wider">
                    Set focus duration
                  </p>

                  {/* Preset pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PRESETS.map((p) => (
                      <button
                        key={p.minutes}
                        onClick={() => setTimerMinutes(p.minutes)}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={
                          timerMinutes === p.minutes
                            ? { background: 'linear-gradient(to right, var(--cal-secondary), var(--cal-primary))', color: '#fff' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                        }
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom minutes input + Start */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Math.max(1, Math.min(480, Number(e.target.value))))}
                      className="w-16 text-center text-sm font-bold text-white rounded-lg px-2 py-1.5 outline-none border"
                      style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                    />
                    <span className="text-xs text-white/35">min</span>

                    {otherTimerActive && (
                      <span className="text-[10px] text-[#FFA502] ml-1">⚠ Will replace active timer</span>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setShowTimerInput(false)}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartTimer}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-85"
                        style={{ background: 'linear-gradient(to right, var(--cal-secondary), var(--cal-primary))' }}
                      >
                        <Timer className="h-3 w-3" />
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
