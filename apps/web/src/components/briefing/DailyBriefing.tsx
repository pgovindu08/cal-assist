'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  format, isSameDay, isToday, startOfWeek, endOfWeek,
  eachDayOfInterval, subDays, isBefore, isAfter,
  differenceInMinutes,
} from 'date-fns';
import {
  Mail, CheckSquare, CalendarDays, Flame, ChevronRight,
  Zap, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { useCalendarStore, type CalEvent } from '@/store/calendarStore';
import { useTaskStore, type Task } from '@/store/taskStore';
import { useEmailStore } from '@/store/emailStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const TIMELINE_START = 6;
const TIMELINE_END = 23;
const PX_PER_HOUR = 80;
const XP_MAP: Record<string, number> = { LOW: 10, MEDIUM: 30, HIGH: 50 };

// ── Time helpers ───────────────────────────────────────────────────────────────

function getTimeGradient(hour: number): string {
  if (hour >= 5 && hour < 7)
    return 'linear-gradient(150deg, #0D0F2E 0%, #1A1B4B 35%, #7C3A2D 70%, #C2521E 100%)';
  if (hour >= 7 && hour < 9)
    return 'linear-gradient(150deg, #1A1B5E 0%, #3730A3 45%, #B45309 80%, #D97706 100%)';
  if (hour >= 9 && hour < 12)
    return 'linear-gradient(150deg, #1E1B4B 0%, #3730A3 50%, #1D4ED8 100%)';
  if (hour >= 12 && hour < 15)
    return 'linear-gradient(150deg, #0F1E3D 0%, #1A56DB 55%, #2563EB 100%)';
  if (hour >= 15 && hour < 18)
    return 'linear-gradient(150deg, #1E1B4B 0%, #7C3AED 40%, #B45309 80%, #C2410C 100%)';
  if (hour >= 18 && hour < 21)
    return 'linear-gradient(150deg, #0F0A2E 0%, #1E1B4B 45%, #312E81 100%)';
  return 'linear-gradient(150deg, #020617 0%, #0D0F1A 50%, #0F0A2E 100%)';
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening', emoji: '🌇' };
  return { text: 'Good Night', emoji: '🌙' };
}

function generateTheme(todayEvents: CalEvent[], todayTasks: Task[]): string {
  const pending = todayTasks.filter(t => t.status !== 'DONE');
  const urgent = pending.filter(t => t.priority === 'HIGH');
  const n = todayEvents.length;

  if (n === 0 && pending.length === 0) return 'Wide open day — no meetings, no deadlines. Make it count your way.';
  if (n >= 4 && urgent.length > 0) return `Heavy day — ${n} meetings and ${urgent.length} high-priority task${urgent.length > 1 ? 's' : ''} competing for your attention. Choose wisely.`;
  if (n >= 4) return `${n} meetings today — protect any gap you find for real work.`;
  if (urgent.length > 0) return `"${urgent[0].title}" is the priority. Everything else is secondary.`;
  if (pending.length > 6) return 'Ambitious task list today — prioritize ruthlessly, don\'t spread thin.';
  if (n === 1) return 'Just one event today — mostly clear. A great day to make real progress.';
  if (n === 0) return `No meetings — pure focus time. ${pending.length} task${pending.length !== 1 ? 's' : ''} waiting for you.`;
  return `${n} event${n !== 1 ? 's' : ''} on the board today. Stay focused and move through them.`;
}

function calculateStreak(tasks: Task[]): number {
  const doneDates = new Set(
    tasks.filter(t => t.status === 'DONE').map(t => format(new Date(t.updatedAt), 'yyyy-MM-dd'))
  );
  let streak = 0;
  let check = new Date();
  if (!doneDates.has(format(check, 'yyyy-MM-dd'))) check = subDays(check, 1);
  while (doneDates.has(format(check, 'yyyy-MM-dd'))) {
    streak++;
    check = subDays(check, 1);
  }
  return streak;
}

function parseSenderName(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*<?/);
  return m ? m[1].trim() : from;
}

function labelFreeBlock(minutes: number, nextEvent: CalEvent | null): string {
  if (nextEvent) {
    if (minutes <= 30) return `Buffer before ${nextEvent.title}`;
    if (minutes <= 60) return `${minutes} min · breather before ${nextEvent.title}`;
    return `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? ` ${minutes % 60}m` : ''} free · good focus window`;
  }
  if (minutes >= 120) return `${Math.floor(minutes / 60)}h free — clear the rest of the day`;
  return `${minutes} min free`;
}

// ── Timeline block builder ─────────────────────────────────────────────────────

interface TimelineBlock {
  type: 'event' | 'free';
  event?: CalEvent;
  startMin: number;
  endMin: number;
  nextEvent?: CalEvent;
}

function buildTimeline(events: CalEvent[]): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );
  const startMin = TIMELINE_START * 60;
  const endMin = TIMELINE_END * 60;
  let cursor = startMin;

  for (const ev of sorted) {
    const evStart = new Date(ev.startDateTime).getHours() * 60 + new Date(ev.startDateTime).getMinutes();
    const evEnd = new Date(ev.endDateTime).getHours() * 60 + new Date(ev.endDateTime).getMinutes();
    if (evStart < TIMELINE_START * 60 || evStart > TIMELINE_END * 60) continue;
    if (evStart > cursor) blocks.push({ type: 'free', startMin: cursor, endMin: evStart, nextEvent: ev });
    blocks.push({ type: 'event', event: ev, startMin: evStart, endMin: Math.min(evEnd, endMin) });
    cursor = Math.max(cursor, evEnd);
  }
  if (cursor < endMin) blocks.push({ type: 'free', startMin: cursor, endMin: endMin });
  return blocks;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatChip({
  icon, label, value, color, onClick,
}: {
  icon: React.ReactNode; label: string; value: string; color: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left w-full transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
    >
      <div className="shrink-0" style={{ color }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</p>
        <p className="text-sm font-bold text-white leading-tight truncate">{value}</p>
      </div>
    </motion.button>
  );
}

function GlassCard({
  children, accent, className = '', style,
}: {
  children: React.ReactNode; accent?: string; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: accent ? `1px solid ${accent}28` : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        boxShadow: accent ? `0 0 32px ${accent}12, 0 4px 24px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.3)',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 100; const H = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`${color}18`} />
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.32)' }}>
      {children}
    </h2>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DailyBriefing() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { events, fetchDayEvents, fetchWeekEvents } = useCalendarStore();
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { emails, fetchInbox } = useEmailStore();

  const [now, setNow] = useState(new Date());
  const [activeDayPopover, setActiveDayPopover] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [xpPopups, setXpPopups] = useState<{ id: string; amount: number }[]>([]);

  // Fetch data on mount
  useEffect(() => {
    const today = new Date();
    fetchDayEvents(today);
    fetchWeekEvents(today);
    fetchTasks();
    fetchInbox();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-day-card]')) setActiveDayPopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const hour = now.getHours();
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const { text: greetingText, emoji: greetingEmoji } = getGreeting(hour);

  const todayEvents = events
    .filter(e => isSameDay(new Date(e.startDateTime), now))
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const todayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), now));
  const todayPending = todayTasks.filter(t => t.status !== 'DONE');

  const nowMin = hour * 60 + now.getMinutes();
  const nextEvent = todayEvents.find(e => isAfter(new Date(e.startDateTime), now));

  const unreadCount = emails.length;
  const emailColor = unreadCount > 10 ? '#E02424' : unreadCount > 3 ? '#D97706' : '#057A55';
  const taskColor = todayPending.length > 5 ? '#E02424' : todayPending.length > 2 ? '#D97706' : '#057A55';

  const streak = calculateStreak(tasks);
  const theme = generateTheme(todayEvents, todayTasks);

  // Week data
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (d: Date) => events.filter(e => isSameDay(new Date(e.startDateTime), d));
  const getTasksForDay = (d: Date) => tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), d));

  const weekHours = weekDays.map(d =>
    getEventsForDay(d).reduce((sum, e) => sum + differenceInMinutes(new Date(e.endDateTime), new Date(e.startDateTime)) / 60, 0)
  );
  const maxWeekHours = Math.max(...weekHours, 0.5);

  // Priority targets
  const mustDoTask = todayPending.sort((a, b) => {
    const p = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return p[a.priority] - p[b.priority];
  })[0] ?? null;

  const thisWeekPending = tasks.filter(t => {
    if (!t.dueDate || t.status === 'DONE') return false;
    const d = new Date(t.dueDate);
    return !isBefore(d, weekStart) && !isAfter(d, weekEnd);
  }).sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority]) - ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]));

  const weekGoalTask = thisWeekPending[0] ?? null;

  const weekDoneCount = tasks.filter(t => {
    const d = new Date(t.updatedAt);
    return t.status === 'DONE' && !isBefore(d, weekStart) && !isAfter(d, weekEnd);
  }).length;

  const weekTotalCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isBefore(d, weekStart) && !isAfter(d, weekEnd);
  }).length;

  const sparkValues = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    return tasks.filter(t => t.status === 'DONE' && isSameDay(new Date(t.updatedAt), day)).length;
  });

  // Timeline
  const timelineBlocks = buildTimeline(todayEvents);
  const nowTopPx = ((nowMin - TIMELINE_START * 60) / 60) * PX_PER_HOUR;

  const handleMarkDone = async (task: Task) => {
    if (completingTask) return;
    setCompletingTask(task.id);
    try {
      await updateTask(task.id, { status: 'DONE' });
      const xp = XP_MAP[task.priority] ?? 10;
      const popup = { id: `${task.id}-${Date.now()}`, amount: xp };
      setXpPopups(prev => [...prev, popup]);
      setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== popup.id)), 2200);
    } finally {
      setCompletingTask(null);
    }
  };

  // Cascade animation helper
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  const formatEventTimeShort = (e: CalEvent) =>
    e.allDay ? 'All day' : `${format(new Date(e.startDateTime), 'h:mm')}–${format(new Date(e.endDateTime), 'h:mm a')}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-auto" style={{ background: '#0D0F1A', color: 'white' }}>

      {/* XP fly-up popups */}
      <AnimatePresence>
        {xpPopups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, x: '-50%' }}
            animate={{ opacity: [0, 1, 1, 0], y: -90 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="fixed z-[500] pointer-events-none text-sm font-black left-1/2"
            style={{ bottom: '40%', color: '#FFD700', textShadow: '0 0 12px rgba(255,215,0,0.8)' }}
          >
            +{p.amount} XP ⚡
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── 1. Hero Header ─────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden" style={{ minHeight: '230px' }}>
        {/* Gradient sky */}
        <div className="absolute inset-0" style={{ background: getTimeGradient(hour) }} />

        {/* Noise grain */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient glow orb */}
        <div
          className="absolute -top-20 right-1/3 h-64 w-64 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: hour >= 12 && hour < 18 ? '#D97706' : '#3730A3' }}
        />

        <div className="relative px-8 pt-12 pb-8">
          {/* Greeting */}
          <p className="text-sm font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {greetingEmoji} {greetingText}
          </p>
          <h1
            className="text-5xl font-extrabold text-white mb-1.5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            {firstName}
          </h1>
          <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {format(now, 'EEEE, MMMM do yyyy')}
          </p>

          {/* Today's Theme pill */}
          <div
            className="inline-flex items-start gap-2 rounded-xl px-4 py-3 max-w-xl"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <Zap className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {theme}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="px-6 pb-12 space-y-7">

        {/* ── 2. Stats Row ───────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatChip
            icon={<Mail className="h-4 w-4" />}
            label="Unread Emails"
            value={unreadCount === 0 ? 'All clear ✓' : `${unreadCount} unread`}
            color={emailColor}
            onClick={() => router.push('/email')}
          />
          <StatChip
            icon={<CheckSquare className="h-4 w-4" />}
            label="Tasks Due Today"
            value={todayPending.length === 0 ? 'All done! ✓' : `${todayPending.length} remaining`}
            color={taskColor}
            onClick={() => router.push('/tasks')}
          />
          <StatChip
            icon={<CalendarDays className="h-4 w-4" />}
            label="Next Event"
            value={
              nextEvent
                ? `${nextEvent.title.slice(0, 16)}${nextEvent.title.length > 16 ? '…' : ''} · ${format(new Date(nextEvent.startDateTime), 'h:mm a')}`
                : 'Free rest of day'
            }
            color={nextEvent ? 'var(--cal-primary)' : '#057A55'}
            onClick={() => router.push('/calendar')}
          />
          <StatChip
            icon={<Flame className="h-4 w-4" />}
            label="Day Streak"
            value={`${streak} day${streak !== 1 ? 's' : ''} 🔥`}
            color="#D97706"
            onClick={() => router.push('/tasks')}
          />
        </motion.div>

        {/* ── 3. Week at a Glance ────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.18)}>
          <SectionHeading>Week at a Glance</SectionHeading>
          <GlassCard>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day, dayIdx) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayEvs = getEventsForDay(day);
                  const dayTasks = getTasksForDay(day);
                  const isActive = activeDayPopover === dayKey;
                  const today = isToday(day);
                  const barFrac = weekHours[dayIdx] / maxWeekHours;
                  const evHeavy = dayEvs.length >= dayTasks.length;

                  return (
                    <div key={dayKey} data-day-card className="relative">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveDayPopover(isActive ? null : dayKey)}
                        className="w-full flex flex-col items-center gap-1 rounded-xl py-3 px-1"
                        style={{
                          background: today ? 'rgba(var(--cal-primary-rgb),0.18)' : isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
                          border: today ? '1px solid rgba(var(--cal-primary-rgb),0.45)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: today ? '0 0 14px rgba(var(--cal-primary-rgb),0.22)' : 'none',
                        }}
                      >
                        <span className="text-[9px] font-semibold uppercase" style={{ color: today ? '#93C5FD' : 'rgba(255,255,255,0.3)' }}>
                          {format(day, 'EEE')}
                        </span>
                        <span className="text-xl font-bold" style={{ color: today ? 'white' : 'rgba(255,255,255,0.65)' }}>
                          {format(day, 'd')}
                        </span>

                        {/* Dots */}
                        <div className="flex gap-0.5 flex-wrap justify-center" style={{ minHeight: '8px' }}>
                          {dayEvs.slice(0, 3).map((e, i) => (
                            <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
                          ))}
                          {dayTasks.slice(0, 2).map((_, i) => (
                            <div key={`t${i}`} className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--cal-secondary)' }} />
                          ))}
                        </div>

                        {/* Mini bar */}
                        <div className="w-full px-1" style={{ height: '10px', display: 'flex', alignItems: 'flex-end' }}>
                          {barFrac > 0 && (
                            <div
                              className="w-full rounded-sm"
                              style={{
                                height: `${Math.max(barFrac * 10, 2)}px`,
                                background: evHeavy ? 'rgba(var(--cal-primary-rgb),0.55)' : 'rgba(var(--cal-primary-rgb),0.55)',
                              }}
                            />
                          )}
                        </div>
                      </motion.button>

                      {/* Day popover */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.16 }}
                            className="absolute top-full z-50 mt-2 w-56 rounded-xl overflow-hidden"
                            style={{
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(18,20,38,0.97)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              backdropFilter: 'blur(24px)',
                              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                            }}
                          >
                            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                              <p className="text-xs font-bold text-white">{format(day, 'EEEE, MMMM d')}</p>
                            </div>
                            <div className="p-2 space-y-1 max-h-52 overflow-auto">
                              {dayEvs.length === 0 && dayTasks.length === 0 && (
                                <p className="text-xs text-center py-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
                                  Nothing scheduled
                                </p>
                              )}
                              {dayEvs.map(e => (
                                <div
                                  key={e.id}
                                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                                  style={{ background: `${e.color}18` }}
                                >
                                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{e.title}</p>
                                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>{formatEventTimeShort(e)}</p>
                                  </div>
                                </div>
                              ))}
                              {dayTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-2 px-2 py-1">
                                  <div
                                    className="h-3 w-3 rounded shrink-0 border flex items-center justify-center"
                                    style={{ borderColor: 'var(--cal-secondary)', background: t.status === 'DONE' ? 'var(--cal-secondary)' : 'transparent' }}
                                  >
                                    {t.status === 'DONE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                  <p className="text-xs truncate" style={{ color: t.status === 'DONE' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)' }}>
                                    {t.title}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── 4. Today's Agenda Timeline ─────────────────────────────────────── */}
        <motion.div {...fadeUp(0.26)}>
          <SectionHeading>{"Today's Agenda"}</SectionHeading>
          <GlassCard>
            <div className="p-4">
              {todayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <span className="text-5xl">🌅</span>
                  <p className="text-sm font-semibold text-white">Wide open day</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>No events scheduled — make it yours.</p>
                </div>
              ) : (
                <div
                  className="relative pl-16"
                  style={{ height: `${(TIMELINE_END - TIMELINE_START) * PX_PER_HOUR}px` }}
                >
                  {/* Hour grid lines + labels */}
                  {Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => {
                    const h = TIMELINE_START + i;
                    return (
                      <div key={h} className="absolute left-0 right-0 flex items-center" style={{ top: `${i * PX_PER_HOUR}px` }}>
                        <span
                          className="absolute left-0 text-[9px] text-right pr-2"
                          style={{ width: '52px', color: 'rgba(255,255,255,0.2)', lineHeight: 1, marginTop: '-1px' }}
                        >
                          {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                        </span>
                        <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                      </div>
                    );
                  })}

                  {/* Current time line */}
                  {nowMin >= TIMELINE_START * 60 && nowMin <= TIMELINE_END * 60 && (
                    <div
                      className="absolute left-12 right-0 z-20 flex items-center gap-1.5"
                      style={{ top: `${nowTopPx}px` }}
                    >
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: 'var(--cal-primary)', boxShadow: '0 0 8px rgba(var(--cal-primary-rgb),0.9)' }}
                        animate={{ scale: [1, 1.35, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(var(--cal-primary-rgb),0.55)' }} />
                      <span className="text-[10px] font-bold shrink-0 mr-1" style={{ color: 'var(--cal-primary)' }}>
                        {format(now, 'h:mm a')}
                      </span>
                    </div>
                  )}

                  {/* Blocks */}
                  {timelineBlocks.map((block, idx) => {
                    const topPx = ((block.startMin - TIMELINE_START * 60) / 60) * PX_PER_HOUR;
                    const heightPx = ((block.endMin - block.startMin) / 60) * PX_PER_HOUR;

                    if (block.type === 'event' && block.event) {
                      const ev = block.event;
                      const isPast = block.endMin < nowMin;
                      const isNow = nowMin >= block.startMin && nowMin < block.endMin;
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.3 }}
                          className="absolute left-14 right-0 rounded-xl overflow-hidden"
                          style={{
                            top: `${topPx + 2}px`,
                            height: `${Math.max(heightPx - 4, 26)}px`,
                            background: `${ev.color}${isPast ? '18' : '20'}`,
                            border: `1px solid ${ev.color}${isPast ? '25' : '38'}`,
                            opacity: isPast ? 0.45 : 1,
                            boxShadow: isNow ? `0 0 18px ${ev.color}28` : 'none',
                          }}
                        >
                          {isNow && (
                            <motion.div
                              className="absolute inset-0 rounded-xl"
                              style={{ border: `1.5px solid ${ev.color}60` }}
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 2.5, repeat: Infinity }}
                            />
                          )}
                          <div className="flex items-start gap-2 px-3 pt-1.5">
                            <div className="h-1.5 w-1.5 rounded-full mt-1 shrink-0" style={{ background: ev.color }} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate leading-snug">{ev.title}</p>
                              {heightPx > 30 && (
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  {format(new Date(ev.startDateTime), 'h:mm')}–{format(new Date(ev.endDateTime), 'h:mm a')}
                                </p>
                              )}
                              {heightPx > 52 && ev.location && (
                                <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                                  <MapPin className="h-2.5 w-2.5 shrink-0" />{ev.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    }

                    // Free block (only show if >= 30 min)
                    if (block.type === 'free' && heightPx >= 30) {
                      const freeMin = block.endMin - block.startMin;
                      return (
                        <div
                          key={`free-${idx}`}
                          className="absolute left-14 right-0 rounded-xl flex items-center px-3"
                          style={{
                            top: `${topPx + 4}px`,
                            height: `${Math.max(heightPx - 8, 20)}px`,
                            border: '1px dashed rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.015)',
                          }}
                        >
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            {labelFreeBlock(freeMin, block.nextEvent ?? null)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── 5. Priority Targets ─────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.34)}>
          <SectionHeading>Priority Targets</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* Must Do Today */}
            <GlassCard accent="#E02424">
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#E02424' }}>
                  🔥 Must Do Today
                </p>
                {mustDoTask ? (
                  <>
                    <p className="text-sm font-bold text-white leading-snug mb-1">{mustDoTask.title}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {mustDoTask.priority} priority
                        {mustDoTask.dueDate ? ` · ${format(new Date(mustDoTask.dueDate), 'MMM d')}` : ''}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: '#FFD700' }}>
                        +{XP_MAP[mustDoTask.priority]} XP
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleMarkDone(mustDoTask)}
                      disabled={completingTask === mustDoTask.id}
                      className="w-full rounded-xl py-2.5 text-xs font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                      style={{ background: '#E02424' }}
                    >
                      {completingTask === mustDoTask.id ? 'Marking…' : '✓ Mark Done'}
                    </motion.button>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <span className="text-3xl">🏆</span>
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {"You're on top of everything!"}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* This Week's Goal */}
            <GlassCard accent="#D97706">
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#D97706' }}>
                  🎯 {"This Week's Goal"}
                </p>
                {weekGoalTask ? (
                  <>
                    <p className="text-sm font-bold text-white leading-snug mb-1">{weekGoalTask.title}</p>
                    <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      Due {weekGoalTask.dueDate ? format(new Date(weekGoalTask.dueDate), 'EEEE') : 'this week'}
                    </p>
                    {weekTotalCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Weekly progress</span>
                          <span className="text-[10px] font-bold text-white">{weekDoneCount}/{weekTotalCount}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(weekDoneCount / weekTotalCount) * 100}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
                            style={{ background: '#D97706' }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <span className="text-3xl">✨</span>
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {"All this week's tasks handled!"}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Momentum */}
            <GlassCard>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  ⚡ Momentum
                </p>
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-4xl font-black leading-none" style={{ color: '#D97706' }}>{streak}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>day streak 🔥</p>
                  </div>
                  <div className="flex-1 pb-1">
                    <Sparkline values={sparkValues} color="#D97706" />
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {weekDoneCount} task{weekDoneCount !== 1 ? 's' : ''} done this week
                  {weekDoneCount > 0 && ' — keep it up'}
                </p>
              </div>
            </GlassCard>
          </div>
        </motion.div>

        {/* ── 6. Email Snapshot ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.42)}>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading>Email Snapshot</SectionHeading>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-3"
              style={{ background: `${emailColor}12`, border: `1px solid ${emailColor}28` }}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: emailColor }} />
              <span className="text-[10px] font-semibold" style={{ color: emailColor }}>
                {unreadCount} unread
              </span>
            </div>
          </div>

          <GlassCard>
            <div className="p-4">
              {unreadCount === 0 ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                  style={{ background: 'rgba(5,122,85,0.1)', border: '1px solid rgba(5,122,85,0.2)' }}
                >
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-semibold" style={{ color: '#057A55' }}>
                    Inbox zero — {"you're"} clear!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.slice(0, 3).map(email => {
                    const name = parseSenderName(email.from);
                    const urgent = email.category === 'Urgent' || email.isImportant;
                    const dotColor = urgent ? '#E02424' : email.category === 'Needs Reply' ? '#D97706' : 'rgba(255,255,255,0.2)';
                    return (
                      <div
                        key={email.id}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5" style={{ background: dotColor }} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{name}</p>
                          <p className="text-[10px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            {email.summary ?? email.snippet}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => router.push('/email')}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.06]"
                style={{ color: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                Open Email Hub
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </div>
  );
}
