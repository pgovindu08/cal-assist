'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame, Trophy, Zap, Target, Swords, Eye, EyeOff, X, Plus, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/store/taskStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { cn } from '@/lib/utils';
import { useSettingsStore, LEVEL_TITLE_SETS } from '@/store/settingsStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const MOTIVATIONAL = [
  'Small steps. Big results.',
  'Every task you finish gets you closer.',
  'Progress, not perfection.',
  'Your past self would be proud.',
  "Today's effort is tomorrow's reward.",
  'The momentum is yours — keep it.',
  "3 tasks left. You've got this.",
  "One task at a time. That's all it takes.",
];


const EMPTY_STATES: Record<string, { emoji: string; line1: string; line2: string }> = {
  'Do Today':  { emoji: '✅', line1: "You're all caught up!",       line2: 'Nothing due today.' },
  'Up Next':   { emoji: '🎯', line1: "You're ahead of the game!",   line2: 'Nothing scheduled up next.' },
  'Someday':   { emoji: '🌙', line1: 'No backlog — nice.',          line2: 'Future you says thanks.' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────


function computeStreak(tasks: Task[]): number {
  const done = tasks.filter((t) => t.status === 'DONE');
  if (!done.length) return 0;
  const dateStrings = new Set(done.map((t) => new Date(t.updatedAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (dateStrings.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function startOfDay(d = new Date()) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// ── SVG Circular Progress Ring ─────────────────────────────────────────────────

function ProgressRing({
  value, size = 56, stroke = 5, color,
}: { value: number; size?: number; stroke?: number; color: string }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(Math.max(value, 0), 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── XP Popup ──────────────────────────────────────────────────────────────────

interface XPPopupItem { id: number; amount: number }

function XPPopups({ items }: { items: XPPopupItem[] }) {
  return (
    <>
      {items.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: 0, x: '-50%' }}
          animate={{ opacity: 0, y: -70 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className="fixed z-[200] top-24 left-1/2 pointer-events-none select-none"
          style={{ fontWeight: 900, fontSize: 20, color: 'var(--cal-secondary)',
            textShadow: '0 0 20px rgba(var(--cal-primary-rgb),0.8)' }}
        >
          +{p.amount} XP ⚡
        </motion.div>
      ))}
    </>
  );
}

// ── Swim-lane sub-component ────────────────────────────────────────────────────

function SwimLane({
  title, emoji, accentColor, tasks, onComplete, onAddClick,
}: {
  title: string; emoji: string; accentColor: string;
  tasks: Task[]; onComplete: (xp: number) => void; onAddClick: () => void;
}) {
  const emptyState = EMPTY_STATES[title];
  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Lane header */}
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{emoji}</span>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
          {title}
        </h3>
        <span className="ml-auto text-xs font-semibold text-white/30">{tasks.length}</span>
      </div>
      <div className="h-px" style={{ background: `${accentColor}30` }} />

      {/* Task cards */}
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <span className="text-2xl">{emptyState.emoji}</span>
            <p className="text-xs font-semibold text-white/40">{emptyState.line1}</p>
            <p className="text-[10px] text-white/20">{emptyState.line2}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              glowEffect={task.priority === 'HIGH' && title === 'Do Today'}
            />
          ))
        )}
      </div>

      {/* Ghost add-task card */}
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 w-full rounded-xl border border-dashed border-white/[0.08]
          px-3 py-2.5 text-xs text-white/25 hover:border-white/25 hover:text-white/55 transition-all"
        style={{ borderColor: `${accentColor}25` }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TaskList() {
  const { tasks, isLoading, fetchTasks, updateTask } = useTaskStore();
  const { xpHigh, xpMedium, xpLow, lazyModeCount, levelTitleSet } = useSettingsStore();

  // Dynamic XP map from settings
  const XP_MAP = { HIGH: xpHigh, MEDIUM: xpMedium, LOW: xpLow } as const;
  const levelTitles = LEVEL_TITLE_SETS[levelTitleSet];

  const [lazyMode,    setLazyMode]    = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [focusTask,   setFocusTask]   = useState<Task | null>(null);
  const [comboCount,  setComboCount]  = useState(0);
  const [showCombo,   setShowCombo]   = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [xpPopups,    setXpPopups]    = useState<XPPopupItem[]>([]);
  const popupId   = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const doneTasks    = useMemo(() => tasks.filter((t) => t.status === 'DONE'),    [tasks]);
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'DONE'),    [tasks]);

  const totalXP  = useMemo(() => doneTasks.reduce((s, t) => s + XP_MAP[t.priority], 0), [doneTasks]);
  const level    = Math.floor(totalXP / 500) + 1;
  const levelXP  = totalXP % 500;
  const levelPct = levelXP / 500;

  const streak = useMemo(() => computeStreak(tasks), [tasks]);

  const weekAgo   = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d; }, []);
  const weekTasks = useMemo(() => tasks.filter((t) => new Date(t.createdAt) >= weekAgo), [tasks, weekAgo]);
  const weekDone  = useMemo(() => weekTasks.filter((t) => t.status === 'DONE'), [weekTasks]);
  const weekXP    = useMemo(() => weekDone.reduce((s, t) => s + XP_MAP[t.priority], 0), [weekDone]);
  const weekRate  = weekTasks.length ? Math.round((weekDone.length / weekTasks.length) * 100) : 0;

  const motivationalCopy = MOTIVATIONAL[new Date().getHours() % MOTIVATIONAL.length];

  // ── Date helpers ────────────────────────────────────────────────────────────

  const today    = useMemo(() => startOfDay(), []);
  const tomorrow = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 1); return d; }, [today]);
  const nextWeek = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d; }, [today]);

  // ── Swim lane buckets ───────────────────────────────────────────────────────

  const lanes = useMemo(() => {
    const source = pendingTasks;

    if (selectedDay) {
      const filtered = tasks.filter(
        (t) => t.dueDate && isSameDay(new Date(t.dueDate), selectedDay),
      );
      return { doToday: filtered, upNext: [], someday: [] };
    }

    if (lazyMode) {
      const sorted = [...source].sort((a, b) =>
        ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority]) - ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]),
      );
      return { doToday: sorted.slice(0, lazyModeCount), upNext: [], someday: [] };
    }

    return {
      doToday: source.filter((t) => t.dueDate && new Date(t.dueDate) < tomorrow),
      upNext:  source.filter((t) => { if (!t.dueDate) return false; const d = new Date(t.dueDate); return d >= tomorrow && d < nextWeek; }),
      someday: source.filter((t) => !t.dueDate || new Date(t.dueDate) >= nextWeek),
    };
  }, [pendingTasks, tasks, selectedDay, lazyMode, tomorrow, nextWeek]);

  // ── Boss battle ─────────────────────────────────────────────────────────────

  const bossBattle = useMemo(() =>
    pendingTasks
      .filter((t) => t.dueDate && new Date(t.dueDate) < today)
      .sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority]) - ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]))[0]
    ?? null,
  [pendingTasks, today]);

  // ── Daily Focus ──────────────────────────────────────────────────────────────

  const dailyFocus = useMemo(
    () => pendingTasks.find((t) => t.priority === 'HIGH')
       ?? pendingTasks.find((t) => t.priority === 'MEDIUM')
       ?? pendingTasks[0]
       ?? null,
    [pendingTasks],
  );

  // ── Calendar strip ───────────────────────────────────────────────────────────

  const calDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; }),
    [today],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.dueDate) map.set(new Date(t.dueDate).toDateString(), (map.get(new Date(t.dueDate).toDateString()) ?? 0) + 1);
    });
    return map;
  }, [tasks]);

  // Today's quests progress
  const todayDoneCount = useMemo(
    () => doneTasks.filter((t) => t.dueDate && new Date(t.dueDate) < tomorrow).length,
    [doneTasks, tomorrow],
  );
  const todayTotal = lanes.doToday.length + todayDoneCount;
  const todayPct   = todayTotal ? Math.round((todayDoneCount / todayTotal) * 100) : 0;

  // ── XP popup ────────────────────────────────────────────────────────────────

  const showXPPopup = (amount: number) => {
    const id = ++popupId.current;
    setXpPopups((prev) => [...prev, { id, amount }]);
    setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== id)), 1400);
  };

  // ── Combo + complete handler ─────────────────────────────────────────────────

  const handleTaskComplete = (xp: number) => {
    showXPPopup(xp);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    setComboCount((prev) => {
      const next = prev + 1;
      if (next >= 3) setShowCombo(true);
      return next;
    });
    comboTimer.current = setTimeout(() => { setComboCount(0); setShowCombo(false); }, 30_000);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#0F1117' }}>
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--cal-secondary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <>
      <XPPopups items={xpPopups} />

      {/* ── Focus Mode Overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {focusTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-8"
          >
            <button
              onClick={() => setFocusTask(null)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <p className="text-white/40 text-xs mb-3 tracking-widest uppercase">Focus Mode</p>
            <h2 className="text-3xl font-black text-white text-center max-w-lg mb-4 leading-tight">
              {focusTask.title}
            </h2>
            {focusTask.notes && (
              <p className="text-white/40 text-sm text-center max-w-md mb-8">{focusTask.notes}</p>
            )}
            <button
              onClick={async () => {
                await updateTask(focusTask.id, { status: 'DONE' });
                handleTaskComplete(XP_MAP[focusTask.priority]);
                setFocusTask(null);
              }}
              className="px-8 py-4 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--cal-secondary), var(--cal-primary))' }}
            >
              Mark Complete ✓
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0F1117' }}>

        {/* ── Hero Stats Bar ─────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 border-b border-white/[0.05] px-6 py-5 backdrop-blur-md"
          style={{ background: 'rgba(15,17,23,0.95)' }}
        >
          <div className="flex items-center gap-6 flex-wrap">
            {/* Level badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--cal-secondary), var(--cal-primary))',
                  boxShadow: '0 0 20px rgba(var(--cal-primary-rgb),0.4)',
                }}
              >
                {level}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Level {level}</p>
                <p className="text-sm font-bold text-white">{levelTitles[Math.min(level - 1, levelTitles.length - 1)]}</p>
              </div>
            </div>

            {/* XP bar — takes remaining width */}
            <div className="flex-1 min-w-[160px]">
              <div className="flex justify-between text-[11px] text-white/40 mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" style={{ color: 'var(--cal-secondary)' }} />
                  <span className="font-semibold text-white/60">{totalXP.toLocaleString()} XP</span>
                </span>
                <span>{levelXP} / 500 to next level</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-white/[0.06]"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelPct * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(to right, var(--cal-secondary), var(--cal-primary))',
                    boxShadow: '0 0 12px rgba(var(--cal-primary-rgb),0.7)',
                  }}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-2xl leading-none">🔥</span>
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Streak</p>
                <p className="text-sm font-bold text-white">{streak} Day{streak !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Weekly completion ring */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative">
                <ProgressRing value={weekRate} color="#2ED573" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{weekRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">This Week</p>
                <p className="text-xs font-medium text-white/60">{weekDone.length}/{weekTasks.length} done</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">

          {/* ── Motivational copy + Lazy Mode ────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-white/35 italic">{motivationalCopy}</p>
            <button
              onClick={() => setLazyMode(!lazyMode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all',
                lazyMode ? 'text-white' : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white',
              )}
              style={lazyMode ? { background: 'linear-gradient(to right, var(--cal-secondary), var(--cal-primary))', boxShadow: '0 0 16px rgba(var(--cal-primary-rgb),0.4)' } : {}}
            >
              {lazyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {lazyMode ? 'Lazy Mode ON' : 'Lazy Mode'}
            </button>
          </div>

          <AnimatePresence>
            {lazyMode && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-center text-xs text-white/40 -mt-2"
              >
                Just {Math.min(3, lanes.doToday.length)} task{lanes.doToday.length !== 1 ? 's' : ''}. That&apos;s it. You got this.
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Overview Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">

            {/* Today's Quests */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1A1D2E] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 shrink-0" style={{ color: 'var(--cal-primary)' }} />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Today&apos;s Quests</span>
              </div>
              <p className="text-3xl font-black text-white leading-none">
                {todayDoneCount}
                <span className="text-lg text-white/30 font-semibold">/{todayTotal}</span>
              </p>
              <div className="mt-2.5 h-2 rounded-full overflow-hidden bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${todayPct}%`,
                    background: 'var(--cal-primary)',
                    boxShadow: todayPct > 0 ? '0 0 8px rgba(var(--cal-primary-rgb),0.6)' : 'none',
                  }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-white/30">{todayPct}% complete today</p>
            </div>

            {/* Weekly Loot */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1A1D2E] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 shrink-0" style={{ color: weekXP > 0 ? '#FFA502' : 'rgba(255,255,255,0.2)' }} />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Weekly Loot</span>
              </div>
              {weekXP === 0 ? (
                <div>
                  <p className="text-2xl mb-1">🔒</p>
                  <p className="text-xs text-white/30 leading-snug">Complete tasks to unlock your loot!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-1.5">
                    <p className="text-3xl font-black text-white leading-none">{weekXP}</p>
                    <p className="text-sm text-white/40 mb-0.5">XP</p>
                  </div>
                  <div className="mt-2.5 h-2 rounded-full overflow-hidden bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((weekXP / 1000) * 100, 100)}%`,
                        background: '#FFA502',
                        boxShadow: '0 0 8px rgba(255,165,2,0.5)',
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/30">{weekDone.length} tasks this week</p>
                </>
              )}
            </div>

            {/* Boss Battle */}
            <div className={cn(
              'rounded-2xl border p-4 transition-all duration-300',
              bossBattle
                ? 'border-[#FF4757]/25 bg-[#FF4757]/[0.07] shadow-[0_0_20px_rgba(255,71,87,0.1)]'
                : 'border-white/[0.07] bg-[#1A1D2E]',
            )}>
              <div className="flex items-center gap-2 mb-3">
                {bossBattle
                  ? <Swords className="h-4 w-4 shrink-0" style={{ color: '#FF4757' }} />
                  : <Shield className="h-4 w-4 shrink-0" style={{ color: '#2ED573' }} />
                }
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Boss Battle</span>
              </div>
              {bossBattle ? (
                <>
                  <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{bossBattle.title}</p>
                  <p className="mt-1.5 text-[10px]" style={{ color: '#FF4757' }}>Overdue — defeat it first!</p>
                </>
              ) : (
                <>
                  <p className="text-xl mb-1">🛡️</p>
                  <p className="text-sm font-semibold" style={{ color: '#2ED573' }}>All clear!</p>
                  <p className="text-[10px] text-white/30 mt-0.5">No boss today</p>
                </>
              )}
            </div>
          </div>

          {/* ── Daily Focus ───────────────────────────────────────────────────── */}
          <AnimatePresence>
            {dailyFocus && !lazyMode && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.08] bg-[#1A1D2E] p-5"
                style={{ boxShadow: '0 0 32px rgba(var(--cal-primary-rgb),0.07)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4" style={{ color: 'var(--cal-secondary)' }} />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Daily Focus</span>
                  </div>
                  <button
                    onClick={() => setFocusTask(dailyFocus)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: 'linear-gradient(to right, var(--cal-secondary), var(--cal-primary))' }}
                  >
                    Start Focus Mode
                  </button>
                </div>
                <p className="text-lg font-bold text-white leading-snug">{dailyFocus.title}</p>
                {dailyFocus.notes && (
                  <p className="mt-1 text-xs text-white/35 line-clamp-2">{dailyFocus.notes}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Mini Calendar Strip ───────────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {calDays.map((day, i) => {
              const key        = day.toDateString();
              const count      = tasksByDay.get(key) ?? 0;
              const isToday    = i === 0;
              const isSelected = selectedDay?.toDateString() === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border shrink-0 transition-all min-w-[56px]"
                  style={{
                    borderColor: isSelected ? 'var(--cal-secondary)' : isToday ? 'rgba(var(--cal-primary-rgb),0.4)' : 'rgba(255,255,255,0.07)',
                    background:  isSelected ? 'rgba(var(--cal-primary-rgb),0.18)' : '#1A1D2E',
                    boxShadow:   isToday && !isSelected ? '0 0 14px rgba(var(--cal-primary-rgb),0.15)' : 'none',
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase text-white/40">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-sm font-black" style={{ color: isToday ? 'var(--cal-primary)' : 'white' }}>
                    {day.getDate()}
                  </span>
                  <div className="flex gap-0.5 h-2 items-center">
                    {count > 0
                      ? Array.from({ length: Math.min(count, 4) }).map((_, j) => (
                          <div key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--cal-secondary)' }} />
                        ))
                      : <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                    }
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Combo Banner ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showCombo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-xl px-5 py-3 text-center font-bold text-white text-sm"
                style={{ background: 'linear-gradient(to right, #FF4757, #FFA502)' }}
              >
                🔥 ON A ROLL! 2× XP — {comboCount} tasks in a row!
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Swim Lanes ────────────────────────────────────────────────────── */}
          {lazyMode ? (
            <div className="space-y-3">
              {lanes.doToday.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <span className="text-4xl">🎉</span>
                  <p className="text-white/50 font-semibold">All done for today!</p>
                  <p className="text-xs text-white/25">Turn off Lazy Mode to see everything.</p>
                </div>
              ) : (
                lanes.doToday.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleTaskComplete}
                    glowEffect={task.priority === 'HIGH'} />
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              <SwimLane title="Do Today" emoji="⚡" accentColor="#FF4757"
                tasks={lanes.doToday} onComplete={handleTaskComplete}
                onAddClick={() => setShowAddForm(true)} />
              <SwimLane title="Up Next" emoji="📅" accentColor="#FFA502"
                tasks={lanes.upNext} onComplete={handleTaskComplete}
                onAddClick={() => setShowAddForm(true)} />
              <SwimLane title="Someday" emoji="🌙" accentColor="#5352ED"
                tasks={lanes.someday} onComplete={handleTaskComplete}
                onAddClick={() => setShowAddForm(true)} />
            </div>
          )}

          {/* ── Add Task Form ─────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TaskForm onClose={() => setShowAddForm(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 w-full rounded-xl border border-dashed border-white/[0.07]
                px-4 py-3 text-sm text-white/25 hover:border-white/20 hover:text-white/55 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add new task
            </button>
          )}

          {/* ── Wins Wall ─────────────────────────────────────────────────────── */}
          {doneTasks.length > 0 && (
            <details className="group">
              <summary className="list-none cursor-pointer select-none py-2">
                <div className="flex items-center gap-3 text-xs text-white/30 hover:text-white/50 transition-colors">
                  <span className="flex-1 border-t border-white/[0.05]" />
                  <span className="flex items-center gap-1.5 shrink-0">
                    🏆 Wins Wall <span className="text-white/20">({doneTasks.length})</span>
                  </span>
                  <span className="flex-1 border-t border-white/[0.05]" />
                </div>
              </summary>
              <div className="mt-3 space-y-2">
                {doneTasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl bg-[#1A1D2E]/60 border border-white/[0.05] px-4 py-2.5"
                  >
                    <span className="text-sm">✅</span>
                    <p className="flex-1 text-xs text-white/40 line-through truncate">{task.title}</p>
                    <span
                      className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--cal-secondary)', background: 'rgba(var(--cal-primary-rgb),0.12)' }}
                    >
                      +{XP_MAP[task.priority]} XP
                    </span>
                  </div>
                ))}
                {doneTasks.length > 10 && (
                  <p className="text-center text-[10px] text-white/20 py-1">
                    +{doneTasks.length - 10} more completed tasks
                  </p>
                )}
              </div>
            </details>
          )}

          <div className="pb-8" />
        </div>
      </div>
    </>
  );
}
