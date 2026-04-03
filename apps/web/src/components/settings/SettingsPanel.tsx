'use client';

import { useState } from 'react';
import {
  Palette, Bell, Bot, CalendarDays, CheckSquare,
  Mail, Mic, Shield, Puzzle, Info,
  ChevronRight, Check, Trash2, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import {
  useSettingsStore,
  THEME_ACCENTS, LEVEL_TITLE_SETS,
  type Theme, type SettingsState,
} from '@/store/settingsStore';
import { api } from '@/lib/api';

// ── Design tokens ──────────────────────────────────────────────────────────────

const BG       = '#0D0F1A';
const SURFACE  = 'rgba(255,255,255,0.035)';
const BORDER   = 'rgba(255,255,255,0.07)';
const MUTED    = 'rgba(255,255,255,0.32)';
const ACCENT   = 'var(--cal-secondary)';   // default purple accent

// ── Primitive controls ─────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
  accent = ACCENT,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200"
      style={{ background: value ? accent : 'rgba(255,255,255,0.12)' }}
      aria-checked={value}
      role="switch"
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

function Select<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: '140px',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Slider({
  value, min = 0, max = 100, step = 1, onChange,
  leftLabel, rightLabel, accent = ACCENT,
}: {
  value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
  leftLabel?: string; rightLabel?: string; accent?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-500 h-1 rounded-full cursor-pointer"
        style={{ accentColor: accent }}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between">
          <span className="text-[10px]" style={{ color: MUTED }}>{leftLabel}</span>
          <span className="text-[10px]" style={{ color: MUTED }}>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  value, min, max, onChange, suffix,
}: {
  value: number; min?: number; max?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-16 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      {suffix && <span className="text-xs" style={{ color: MUTED }}>{suffix}</span>}
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg px-3 py-1.5 text-xs text-white outline-none"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
    />
  );
}

function SegmentControl<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex rounded-xl overflow-hidden p-0.5"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: value === o.value ? ACCENT : 'transparent',
            color: value === o.value ? 'white' : MUTED,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const toggle = (i: number) => {
    if (value.includes(i)) onChange(value.filter(d => d !== i));
    else onChange([...value, i].sort());
  };
  return (
    <div className="flex gap-1.5">
      {days.map((d, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="h-7 w-7 rounded-full text-xs font-bold transition-all"
          style={{
            background: value.includes(i) ? ACCENT : 'rgba(255,255,255,0.06)',
            color: value.includes(i) ? 'white' : MUTED,
            border: `1px solid ${value.includes(i) ? ACCENT : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

// ── Reusable layout primitives ─────────────────────────────────────────────────

function SettingRow({
  label, description, children, last = false,
}: {
  label: string; description: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-6 py-4"
      style={{ borderBottom: last ? 'none' : `1px solid ${BORDER}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: MUTED }}>{description}</p>
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="px-5">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-white mb-4 mt-7 first:mt-0">{children}</h2>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 mt-5" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

// ── Nav item list ──────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'appearance',    label: 'Appearance',      icon: Palette     },
  { id: 'notifications', label: 'Notifications',   icon: Bell        },
  { id: 'ai',            label: 'AI & Assistant',  icon: Bot         },
  { id: 'calendar',      label: 'Calendar',        icon: CalendarDays},
  { id: 'tasks',         label: 'Tasks',           icon: CheckSquare },
  { id: 'email',         label: 'Email',           icon: Mail        },
  { id: 'voice',         label: 'Voice',           icon: Mic         },
  { id: 'account',       label: 'Account',         icon: Shield      },
  { id: 'integrations',  label: 'Integrations',    icon: Puzzle      },
  { id: 'about',         label: 'About',           icon: Info        },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Theme preview mini cards ───────────────────────────────────────────────────

function ThemeCard({ id, active, onClick }: { id: Theme; active: boolean; onClick: () => void }) {
  const { primary, secondary, label } = THEME_ACCENTS[id];
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl overflow-hidden p-3 text-left w-full"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: active ? `2px solid ${primary}` : `2px solid rgba(255,255,255,0.07)`,
        boxShadow: active ? `0 0 16px ${primary}30` : 'none',
      }}
    >
      {/* Mini app preview */}
      <div className="w-full rounded-lg overflow-hidden" style={{ height: '52px', background: '#0D0F1A', display: 'flex' }}>
        {/* Sidebar strip */}
        <div className="w-5 h-full flex flex-col items-center gap-1 pt-1.5" style={{ background: '#12141F' }}>
          <div className="h-2.5 w-2.5 rounded" style={{ background: primary }} />
          {[secondary, primary, secondary].map((c, i) => (
            <div key={i} className="h-2 w-2 rounded-sm" style={{ background: `${c}55` }} />
          ))}
        </div>
        {/* Content area */}
        <div className="flex-1 p-1 flex flex-col gap-1">
          <div className="h-2 rounded" style={{ background: `${primary}35`, width: '70%' }} />
          <div className="h-1.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', width: '90%' }} />
          <div className="h-1.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', width: '60%' }} />
          <div className="mt-auto flex gap-1">
            <div className="h-2.5 rounded-md flex-1" style={{ background: primary }} />
            <div className="h-2.5 rounded-md w-8" style={{ background: `${secondary}50` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white">{label}</span>
        {active && <Check className="h-3 w-3" style={{ color: primary }} />}
      </div>
    </motion.button>
  );
}

// ── Section components ─────────────────────────────────────────────────────────

function AppearanceSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  const themes = Object.keys(THEME_ACCENTS) as Theme[];

  return (
    <div>
      <SectionTitle>Make Cal yours</SectionTitle>

      <Subtitle>Theme</Subtitle>
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {themes.map(id => (
          <ThemeCard key={id} id={id} active={s.theme === id} onClick={() => set('theme', id)} />
        ))}
      </div>

      <SectionCard>
        <SettingRow
          label="Font Size"
          description="Affects all text across the app proportionally."
        >
          <SegmentControl
            value={s.fontSizeScale}
            options={[
              { value: 'small', label: 'S' },
              { value: 'default', label: 'M' },
              { value: 'large', label: 'L' },
            ]}
            onChange={v => set('fontSizeScale', v)}
          />
        </SettingRow>

        <SettingRow
          label="Card Style"
          description="Changes how every card looks across the entire app."
        >
          <SegmentControl
            value={s.cardStyle}
            options={[
              { value: 'glass', label: 'Glass' },
              { value: 'solid', label: 'Solid' },
              { value: 'outlined', label: 'Outlined' },
            ]}
            onChange={v => set('cardStyle', v)}
          />
        </SettingRow>

        <SettingRow
          label="Briefing Header"
          description="Visual style of the hero area in the Daily Briefing tab."
        >
          <SegmentControl
            value={s.briefingHeaderStyle}
            options={[
              { value: 'gradient', label: 'Gradient' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'photo', label: 'Photo' },
            ]}
            onChange={v => set('briefingHeaderStyle', v)}
          />
        </SettingRow>

        <SettingRow
          label="Sidebar Style"
          description="Show just icons, or icons with labels always visible."
          last
        >
          <SegmentControl
            value={s.sidebarStyle}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'expanded', label: 'Expanded' },
            ]}
            onChange={v => set('sidebarStyle', v)}
          />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function NotificationsSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  return (
    <div>
      <SectionTitle>When should Cal reach out?</SectionTitle>

      <Subtitle>Daily Briefing</Subtitle>
      <SectionCard>
        <SettingRow label="Briefing Time" description="What time your daily briefing is generated each morning.">
          <TimeInput value={s.briefingTime} onChange={v => set('briefingTime', v)} />
        </SettingRow>
        <SettingRow label="Briefing Days" description="Which days of the week your briefing runs." last>
          <DayPicker value={s.briefingDays} onChange={v => set('briefingDays', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Email</Subtitle>
      <SectionCard>
        <SettingRow label="Notify for Urgent Emails" description="Get a push notification when Cal flags an email as urgent.">
          <Toggle value={s.notifyUrgentEmail} onChange={v => set('notifyUrgentEmail', v)} />
        </SettingRow>
        <SettingRow label="Unread Email Threshold" description="Notify when unread count exceeds this. Set 0 to disable." last>
          <NumberInput value={s.notifyEmailThreshold} min={0} max={100} suffix="emails" onChange={v => set('notifyEmailThreshold', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Tasks & Habits</Subtitle>
      <SectionCard>
        <SettingRow label="Streak at Risk Reminder" description="Cal nudges you in the evening if you haven't completed any tasks and your streak is on the line.">
          <Toggle value={s.streakNotifications} onChange={v => set('streakNotifications', v)} />
        </SettingRow>
        <SettingRow label="Meeting Notes Prompt" description="Cal automatically asks you to add notes when a calendar event ends." last>
          <Toggle value={s.meetingNotesPrompt} onChange={v => set('meetingNotesPrompt', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Quiet Hours</Subtitle>
      <SectionCard>
        <SettingRow label="Start" description="No notifications are sent after this time.">
          <TimeInput value={s.quietHoursStart} onChange={v => set('quietHoursStart', v)} />
        </SettingRow>
        <SettingRow label="End" description="Notifications resume after this time." last>
          <TimeInput value={s.quietHoursEnd} onChange={v => set('quietHoursEnd', v)} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function AISection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  return (
    <div>
      <SectionTitle>How should Cal think and talk?</SectionTitle>

      <SectionCard>
        <SettingRow label={`${s.calName}'s Name`} description="Every greeting and response uses this name. Default is Cal.">
          <input
            type="text"
            value={s.calName}
            onChange={e => set('calName', e.target.value || 'Cal')}
            maxLength={20}
            className="rounded-lg px-3 py-1.5 text-sm text-white outline-none w-28 text-right"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </SettingRow>

        <SettingRow label="Response Style" description="How Cal communicates in chat — short and direct, or warm and conversational.">
          <Select
            value={s.responseStyle}
            options={[
              { value: 'concise', label: 'Concise' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'conversational', label: 'Conversational' },
            ]}
            onChange={v => set('responseStyle', v)}
          />
        </SettingRow>

        <SettingRow label="AI Creativity" description="Low = precise and formal responses. High = expressive and personality-filled.">
          <Slider
            value={s.aiCreativity}
            onChange={v => set('aiCreativity', v)}
            leftLabel="Precise"
            rightLabel="Creative"
          />
        </SettingRow>

        <SettingRow label="Default Email Tone" description="Starting tone for every email Cal drafts — always overrideable per email.">
          <Select
            value={s.defaultEmailTone}
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly Professional' },
              { value: 'casual', label: 'Casual' },
              { value: 'formal', label: 'Formal' },
            ]}
            onChange={v => set('defaultEmailTone', v)}
          />
        </SettingRow>

        <SettingRow label="Auto-detect Task Priority" description="Cal reads the language in your chat messages to automatically assign HIGH / MEDIUM / LOW.">
          <Toggle value={s.taskPriorityDetection} onChange={v => set('taskPriorityDetection', v)} />
        </SettingRow>

        <SettingRow label="Proactive Suggestions" description={"Cal occasionally suggests what to work on during free blocks or when your schedule looks light."}>
          <Toggle value={s.proactiveSuggestions} onChange={v => set('proactiveSuggestions', v)} />
        </SettingRow>

        <SettingRow label="Auto-create Tasks from Meeting Notes" description="Action items detected in meeting notes become tasks automatically — no confirmation prompt.">
          <Toggle value={s.meetingNotesAutoTask} onChange={v => set('meetingNotesAutoTask', v)} />
        </SettingRow>

        <SettingRow label="Email Flagging Sensitivity" description="Controls how aggressively Cal marks emails as urgent. Higher = more flags." last>
          <Slider
            value={s.emailFlaggerSensitivity}
            onChange={v => set('emailFlaggerSensitivity', v)}
            leftLabel="Low"
            rightLabel="High"
          />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function CalendarSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  return (
    <div>
      <SectionTitle>Your schedule, your rules</SectionTitle>

      <SectionCard>
        <SettingRow label="Default Event Duration" description="When you say 'meeting tomorrow at 2pm' without a duration, Cal uses this.">
          <Select
            value={String(s.defaultEventDuration) as never}
            options={[
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '1 hour' },
              { value: '90', label: '1.5 hours' },
              { value: '120', label: '2 hours' },
            ]}
            onChange={v => set('defaultEventDuration', Number(v))}
          />
        </SettingRow>

        <SettingRow label="Default Calendar View" description="Which view the Calendar tab opens in when you navigate to it.">
          <SegmentControl
            value={s.calendarDefaultView}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            onChange={v => set('calendarDefaultView', v)}
          />
        </SettingRow>

        <SettingRow label="Meeting Buffer" description="Cal adds this gap before or after every event it creates so you have breathing room.">
          <Select
            value={String(s.meetingBuffer) as never}
            options={[
              { value: '0', label: 'None' },
              { value: '5', label: '5 minutes' },
              { value: '10', label: '10 minutes' },
              { value: '15', label: '15 minutes' },
            ]}
            onChange={v => set('meetingBuffer', Number(v))}
          />
        </SettingRow>

        <SettingRow label="Auto-schedule Focus Blocks" description="When your task list is heavy and your calendar is open, Cal suggests creating focus time blocks.">
          <Toggle value={s.focusBlockAutoSchedule} onChange={v => set('focusBlockAutoSchedule', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Working Hours</Subtitle>
      <SectionCard>
        <SettingRow label="Start" description="Cal avoids scheduling outside your working window unless explicitly asked.">
          <TimeInput value={s.workingHoursStart} onChange={v => set('workingHoursStart', v)} />
        </SettingRow>
        <SettingRow label="End" description="End of your typical working day.">
          <TimeInput value={s.workingHoursEnd} onChange={v => set('workingHoursEnd', v)} />
        </SettingRow>
        <SettingRow label="Working Days" description="Days Cal treats as part of your regular work week." last>
          <DayPicker value={s.workingDays} onChange={v => set('workingDays', v)} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function TasksSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  return (
    <div>
      <SectionTitle>Level up your productivity</SectionTitle>

      <Subtitle>XP & Levels</Subtitle>
      <SectionCard>
        <SettingRow label="High Priority XP" description="XP awarded when you complete a HIGH priority task.">
          <NumberInput value={s.xpHigh} min={1} max={500} suffix="XP" onChange={v => set('xpHigh', v)} />
        </SettingRow>
        <SettingRow label="Medium Priority XP" description="XP awarded when you complete a MEDIUM priority task.">
          <NumberInput value={s.xpMedium} min={1} max={500} suffix="XP" onChange={v => set('xpMedium', v)} />
        </SettingRow>
        <SettingRow label="Low Priority XP" description="XP awarded when you complete a LOW priority task.">
          <NumberInput value={s.xpLow} min={1} max={500} suffix="XP" onChange={v => set('xpLow', v)} />
        </SettingRow>
        <SettingRow label="Level Title Style" description="The names of your rank titles as you progress through levels." last>
          <Select
            value={s.levelTitleSet}
            options={[
              { value: 'rpg', label: 'RPG (Rookie → Legend)' },
              { value: 'professional', label: 'Professional (Intern → Exec)' },
              { value: 'space', label: 'Space (Cadet → Admiral)' },
            ]}
            onChange={v => set('levelTitleSet', v)}
          />
        </SettingRow>
      </SectionCard>

      {/* Level preview */}
      <div
        className="mt-3 rounded-xl p-3 flex items-center gap-2 flex-wrap"
        style={{ background: 'rgba(var(--cal-primary-rgb),0.08)', border: '1px solid rgba(var(--cal-primary-rgb),0.2)' }}
      >
        {LEVEL_TITLE_SETS[s.levelTitleSet].map((title, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(var(--cal-primary-rgb),0.15)' }}>
            <span className="text-xs" style={{ color: MUTED }}>{i + 1}</span>
            <span className="text-xs font-semibold text-white">{title}</span>
          </div>
        ))}
      </div>

      <Subtitle>Workflow</Subtitle>
      <SectionCard>
        <SettingRow label="Lazy Mode Task Count" description="How many tasks appear when Lazy Mode is active in the Tasks tab.">
          <SegmentControl
            value={String(s.lazyModeCount) as never}
            options={[
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ]}
            onChange={v => set('lazyModeCount', Number(v))}
          />
        </SettingRow>

        <SettingRow label="Default Sort Order" description="How tasks are ordered within each swim lane.">
          <Select
            value={s.taskSortOrder}
            options={[
              { value: 'priority', label: 'Priority (High → Low)' },
              { value: 'dueDate', label: 'Due Date (Soonest)' },
              { value: 'xp', label: 'XP Value (Highest)' },
              { value: 'manual', label: 'Manual' },
            ]}
            onChange={v => set('taskSortOrder', v)}
          />
        </SettingRow>

        <SettingRow label="Streak Rules" description="Strict counts every calendar day. Relaxed only counts your working days — weekends never break the streak.">
          <SegmentControl
            value={s.streakRules}
            options={[
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'strict', label: 'Strict' },
            ]}
            onChange={v => set('streakRules', v)}
          />
        </SettingRow>

        <SettingRow label="Daily Task Goal" description="Fixed number of tasks to aim for each day. Set 0 to use whatever tasks are actually due." last>
          <NumberInput value={s.dailyTaskGoal} min={0} max={50} suffix={s.dailyTaskGoal === 0 ? '(dynamic)' : 'tasks'} onChange={v => set('dailyTaskGoal', v)} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

function EmailSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  const [newSender, setNewSender] = useState('');

  const addSender = () => {
    const trimmed = newSender.trim().toLowerCase();
    if (trimmed && !s.ignoredSenders.includes(trimmed)) {
      set('ignoredSenders', [...s.ignoredSenders, trimmed]);
      setNewSender('');
    }
  };

  const removeSender = (addr: string) => {
    set('ignoredSenders', s.ignoredSenders.filter(a => a !== addr));
  };

  return (
    <div>
      <SectionTitle>Your email, on your terms</SectionTitle>

      <SectionCard>
        <SettingRow
          label="Email Access Level"
          description="Controls what Cal can do with your Gmail. Changing this requires re-authenticating."
        >
          <Select
            value={s.emailAccessLevel}
            options={[
              { value: 'readonly', label: 'Read Only' },
              { value: 'draft', label: 'Read & Draft' },
              { value: 'full', label: 'Full Access' },
            ]}
            onChange={v => set('emailAccessLevel', v)}
          />
        </SettingRow>

        <SettingRow label="Emails in Summarizer" description="How many unread emails Cal pulls in when you open the Email Hub.">
          <NumberInput value={s.emailsInSummarizer} min={10} max={50} suffix="emails" onChange={v => set('emailsInSummarizer', v)} />
        </SettingRow>

        <SettingRow label="Auto-summarize on Open" description="Cal generates AI summaries automatically when you open Email Hub, without waiting for you to click.">
          <Toggle value={s.autoSummarizeOnOpen} onChange={v => set('autoSummarizeOnOpen', v)} />
        </SettingRow>

        <SettingRow label="Follow-up Reminder" description="Days to wait after sending without a reply before Cal nudges you. Set 0 to disable." last>
          <NumberInput value={s.followupReminderDays} min={0} max={14} suffix={s.followupReminderDays === 0 ? '(off)' : 'days'} onChange={v => set('followupReminderDays', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Email Signature</Subtitle>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-white mb-1">Signature</p>
          <p className="text-xs mb-3" style={{ color: MUTED }}>Cal appends this to every email it drafts on your behalf.</p>
          <textarea
            value={s.emailSignature}
            onChange={e => set('emailSignature', e.target.value)}
            rows={4}
            placeholder="Best,&#10;Your Name"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
            }}
          />
        </div>
      </div>

      <Subtitle>Ignored Senders</Subtitle>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs" style={{ color: MUTED }}>
            Emails from these addresses or domains are never flagged as urgent and never appear in your Briefing snapshot.
          </p>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSender}
              onChange={e => setNewSender(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSender()}
              placeholder="email@example.com or @domain.com"
              className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button
              onClick={addSender}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: ACCENT }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {/* List */}
          {s.ignoredSenders.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>No ignored senders yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.ignoredSenders.map(addr => (
                <div
                  key={addr}
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER}` }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{addr}</span>
                  <button onClick={() => removeSender(addr)} className="hover:text-red-400 transition-colors" style={{ color: MUTED }}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VoiceSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  return (
    <div>
      <SectionTitle>Talk to Cal, your way</SectionTitle>

      <SectionCard>
        <SettingRow label="Voice Input" description="Show the microphone button in chat. Turn off if you never use voice.">
          <Toggle value={s.voiceEnabled} onChange={v => set('voiceEnabled', v)} />
        </SettingRow>

        <SettingRow label="Auto-play Responses" description="Cal speaks its response aloud after you send a voice message.">
          <Toggle value={s.autoPlayResponses} onChange={v => set('autoPlayResponses', v)} />
        </SettingRow>
      </SectionCard>

      <Subtitle>Sound Effects</Subtitle>
      <SectionCard>
        <SettingRow label="Task Completion Sounds" description="Play a satisfying sound when you check off a task.">
          <Toggle value={s.soundEffectsTask} onChange={v => set('soundEffectsTask', v)} />
        </SettingRow>
        <SettingRow label="Celebration Sounds" description="Combo banners, level-ups, and weekly loot plays celebratory audio.">
          <Toggle value={s.soundEffectsCelebration} onChange={v => set('soundEffectsCelebration', v)} />
        </SettingRow>
        <SettingRow label="Briefing Ambient Sound" description="A subtle ambient tone plays for 3 seconds when the Daily Briefing tab opens." last>
          <Toggle value={s.soundEffectsBriefing} onChange={v => set('soundEffectsBriefing', v)} />
        </SettingRow>
      </SectionCard>

      <div
        className="mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: 'rgba(var(--cal-primary-rgb),0.08)', border: '1px solid rgba(var(--cal-primary-rgb),0.2)' }}
      >
        <Mic className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
        <div>
          <p className="text-xs font-semibold text-white">Wake Word (Coming Soon)</p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {'"Hey Cal"'} hands-free activation is on the roadmap. Off by default to protect battery and privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountSection({ s, set }: { s: SettingsState; set: SettingsState['set'] }) {
  const { user, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    window.location.href = '/login';
  };

  const handleExport = () => {
    const data = {
      settings: { ...s },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calassist-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const connectedServices = [
    { name: 'Google Calendar', scope: 'Read & Write', color: 'var(--cal-primary)', connected: true },
    { name: 'Gmail',           scope: 'Read & Draft', color: '#E02424', connected: true },
    { name: 'Google Tasks',    scope: 'Read & Write', color: '#057A55', connected: true },
  ];

  return (
    <div>
      <SectionTitle>Your data, your control</SectionTitle>

      {/* Profile */}
      <SectionCard>
        <div className="py-4 flex items-center gap-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: ACCENT }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{user?.email}</p>
          </div>
        </div>
      </SectionCard>

      <Subtitle>Connected Accounts</Subtitle>
      <div className="space-y-2">
        {connectedServices.map(svc => (
          <div
            key={svc.name}
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full" style={{ background: svc.color }} />
              <div>
                <p className="text-sm font-semibold text-white">{svc.name}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{svc.scope}</p>
              </div>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(5,122,85,0.12)', color: '#057A55', border: '1px solid rgba(5,122,85,0.25)' }}
            >
              Connected
            </span>
          </div>
        ))}
      </div>

      <Subtitle>Data & Privacy</Subtitle>
      <SectionCard>
        <div className="py-4">
          <p className="text-xs leading-relaxed mb-4" style={{ color: MUTED }}>
            Cal stores only your preferences and XP data in its database.
            All calendar, email, and task data lives in{"Google's"} servers — not ours.
            Cal never reads your data to train AI models.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}` }}
            >
              Export My Data
            </button>
            <button
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'rgba(224,36,36,0.08)', border: '1px solid rgba(224,36,36,0.2)', color: '#E02424' }}
            >
              Delete All Cal Data
            </button>
          </div>
        </div>
      </SectionCard>

      <Subtitle>Session</Subtitle>
      <SectionCard>
        <div className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Sign Out</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{"You'll"} be redirected to the login page.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(224,36,36,0.12)', border: '1px solid rgba(224,36,36,0.25)', color: '#E02424' }}
          >
            Sign Out
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

const INTEGRATIONS = [
  { name: 'Google Calendar', desc: 'Create, update, and delete events.', status: 'connected', color: 'var(--cal-primary)' },
  { name: 'Gmail',           desc: 'Read, summarize, and draft emails.',  status: 'connected', color: '#E02424' },
  { name: 'Google Tasks',    desc: 'Sync tasks bidirectionally.',          status: 'connected', color: '#057A55' },
  { name: 'Slack',           desc: 'Get briefings and task updates in Slack.', status: 'soon',  color: '#611F69' },
  { name: 'Notion',          desc: 'Push meeting notes into Notion pages.',    status: 'soon',  color: '#ffffff' },
  { name: 'Google Sheets',   desc: 'Export task and XP data to Sheets.',       status: 'soon',  color: '#188038' },
  { name: 'ElevenLabs Voice',desc: 'Premium AI voice for spoken responses.',   status: 'connect', color: '#7E3AF2' },
];

function IntegrationsSection() {
  return (
    <div>
      <SectionTitle>Connect everything</SectionTitle>
      <div className="space-y-2">
        {INTEGRATIONS.map(int => (
          <div
            key={int.name}
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: int.color }} />
              <div>
                <p className="text-sm font-semibold text-white">{int.name}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{int.desc}</p>
              </div>
            </div>
            {int.status === 'connected' && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(5,122,85,0.12)', color: '#057A55', border: '1px solid rgba(5,122,85,0.25)' }}>
                Connected
              </span>
            )}
            {int.status === 'soon' && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: MUTED, border: `1px solid ${BORDER}` }}>
                Coming Soon
              </span>
            )}
            {int.status === 'connect' && (
              <button
                className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
                style={{ background: int.color }}>
                Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CHANGELOG = [
  { version: '1.4', date: 'Apr 2026', notes: 'Added Daily Briefing tab with live timeline, priority targets, and email snapshot.' },
  { version: '1.3', date: 'Mar 2026', notes: 'Rebuilt the Email Hub with AI categorization and column layout. Added bulk delete with undo.' },
  { version: '1.2', date: 'Mar 2026', notes: 'Tasks tab got XP, level badges, streak counter, Lazy Mode, and Focus Mode overlay.' },
  { version: '1.1', date: 'Feb 2026', notes: 'Voice input now uses Groq Whisper — much more reliable than the old browser API.' },
  { version: '1.0', date: 'Jan 2026', notes: 'First release. Chat, Calendar, and Tasks working with Google sync.' },
];

function AboutSection() {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div>
      <SectionTitle>About CalAssist</SectionTitle>

      {/* Version */}
      <SectionCard>
        <div className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">CalAssist</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Version 1.4 · April 2026</p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(26,86,219,0.12)', color: 'var(--cal-primary)', border: '1px solid rgba(26,86,219,0.25)' }}
          >
            Up to date
          </div>
        </div>
      </SectionCard>

      {/* Changelog */}
      <Subtitle>{"What's New"}</Subtitle>
      <div className="space-y-2">
        {CHANGELOG.map((entry, i) => (
          <div
            key={entry.version}
            className="px-5 py-3.5 rounded-2xl"
            style={{ background: i === 0 ? 'rgba(26,86,219,0.07)' : SURFACE, border: `1px solid ${i === 0 ? 'rgba(26,86,219,0.2)' : BORDER}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white">v{entry.version}</span>
              {i === 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(26,86,219,0.2)', color: '#93C5FD' }}>Latest</span>}
              <span className="text-[11px] ml-auto" style={{ color: MUTED }}>{entry.date}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{entry.notes}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <Subtitle>Send Feedback</Subtitle>
      <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4">
          {sent ? (
            <div className="flex items-center gap-3 py-4">
              <Check className="h-5 w-5" style={{ color: '#057A55' }} />
              <p className="text-sm font-semibold text-white">Thanks! Your feedback was sent.</p>
            </div>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="What could be better? What do you love? Tell Cal anything…"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none leading-relaxed mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
              />
              <button
                onClick={() => { if (feedback.trim()) setSent(true); }}
                disabled={!feedback.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: ACCENT }}
              >
                Send Feedback
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');
  const settings = useSettingsStore();
  const { set } = settings;

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':    return <AppearanceSection    s={settings} set={set} />;
      case 'notifications': return <NotificationsSection s={settings} set={set} />;
      case 'ai':            return <AISection            s={settings} set={set} />;
      case 'calendar':      return <CalendarSection      s={settings} set={set} />;
      case 'tasks':         return <TasksSection         s={settings} set={set} />;
      case 'email':         return <EmailSection         s={settings} set={set} />;
      case 'voice':         return <VoiceSection         s={settings} set={set} />;
      case 'account':       return <AccountSection       s={settings} set={set} />;
      case 'integrations':  return <IntegrationsSection />;
      case 'about':         return <AboutSection />;
    }
  };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: BG, color: 'white' }}
    >
      {/* ── Left nav ── */}
      <nav
        className="flex flex-col py-6 px-3 gap-0.5 shrink-0 border-r overflow-y-auto"
        style={{ width: '200px', borderColor: BORDER }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-3" style={{ color: MUTED }}>
          Settings
        </p>
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const active = id === activeSection;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: active ? 'rgba(var(--cal-primary-rgb),0.14)' : 'transparent',
                color: active ? 'white' : MUTED,
                borderLeft: active ? `2px solid ${ACCENT}` : '2px solid transparent',
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto opacity-40" />}
            </button>
          );
        })}

        {/* Reset to defaults */}
        <div className="mt-auto pt-4 px-3">
          <button
            onClick={() => settings.reset()}
            className="text-[11px] font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Reset to defaults
          </button>
        </div>
      </nav>

      {/* ── Right content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
