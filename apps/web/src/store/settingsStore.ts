import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme =
  | 'midnight' | 'aurora' | 'sunset' | 'ocean'
  | 'monochrome' | 'forest' | 'rose';

export type FontSize = 'small' | 'default' | 'large';
export type CardStyle = 'glass' | 'solid' | 'outlined';
export type SidebarStyle = 'compact' | 'expanded';
export type BriefingHeaderStyle = 'gradient' | 'minimal' | 'photo';
export type ResponseStyle = 'concise' | 'balanced' | 'conversational';
export type EmailTone = 'professional' | 'friendly' | 'casual' | 'formal';
export type CalendarView = 'day' | 'week' | 'month';
export type TaskSortOrder = 'priority' | 'dueDate' | 'xp' | 'manual';
export type StreakRules = 'strict' | 'relaxed';
export type LevelTitleSet = 'rpg' | 'professional' | 'space';
export type EmailAccessLevel = 'readonly' | 'draft' | 'full';

export interface SettingsState {
  // ── Appearance ──────────────────────────────────────────────────────────────
  theme: Theme;
  fontSizeScale: FontSize;
  cardStyle: CardStyle;
  sidebarStyle: SidebarStyle;
  briefingHeaderStyle: BriefingHeaderStyle;

  // ── Notifications ───────────────────────────────────────────────────────────
  briefingTime: string;          // HH:MM
  briefingDays: number[];        // 0=Sun … 6=Sat
  notifyUrgentEmail: boolean;
  notifyEmailThreshold: number;  // 0 = off
  streakNotifications: boolean;
  meetingNotesPrompt: boolean;
  quietHoursStart: string;       // HH:MM
  quietHoursEnd: string;         // HH:MM

  // ── AI & Assistant ──────────────────────────────────────────────────────────
  responseStyle: ResponseStyle;
  aiCreativity: number;          // 0–100
  defaultEmailTone: EmailTone;
  taskPriorityDetection: boolean;
  proactiveSuggestions: boolean;
  meetingNotesAutoTask: boolean;
  emailFlaggerSensitivity: number; // 0–100
  calName: string;

  // ── Calendar ────────────────────────────────────────────────────────────────
  defaultEventDuration: number;  // minutes
  workingHoursStart: string;     // HH:MM
  workingHoursEnd: string;       // HH:MM
  workingDays: number[];
  focusBlockAutoSchedule: boolean;
  meetingBuffer: number;         // minutes, 0 = none
  calendarDefaultView: CalendarView;

  // ── Tasks ───────────────────────────────────────────────────────────────────
  xpHigh: number;
  xpMedium: number;
  xpLow: number;
  levelTitleSet: LevelTitleSet;
  lazyModeCount: number;
  taskSortOrder: TaskSortOrder;
  streakRules: StreakRules;
  dailyTaskGoal: number;         // 0 = dynamic (whatever's due)

  // ── Email ───────────────────────────────────────────────────────────────────
  emailAccessLevel: EmailAccessLevel;
  emailsInSummarizer: number;
  autoSummarizeOnOpen: boolean;
  ignoredSenders: string[];
  emailSignature: string;
  followupReminderDays: number;  // 0 = off

  // ── Voice ───────────────────────────────────────────────────────────────────
  voiceEnabled: boolean;
  autoPlayResponses: boolean;
  soundEffectsTask: boolean;
  soundEffectsCelebration: boolean;
  soundEffectsBriefing: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────
  set: <K extends keyof Omit<SettingsState, 'set'>>(key: K, value: SettingsState[K]) => void;
  reset: () => void;
}

const DEFAULTS: Omit<SettingsState, 'set' | 'reset'> = {
  // Appearance
  theme: 'midnight',
  fontSizeScale: 'default',
  cardStyle: 'glass',
  sidebarStyle: 'compact',
  briefingHeaderStyle: 'gradient',

  // Notifications
  briefingTime: '08:00',
  briefingDays: [0, 1, 2, 3, 4, 5, 6],
  notifyUrgentEmail: true,
  notifyEmailThreshold: 0,
  streakNotifications: true,
  meetingNotesPrompt: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',

  // AI
  responseStyle: 'balanced',
  aiCreativity: 50,
  defaultEmailTone: 'friendly',
  taskPriorityDetection: true,
  proactiveSuggestions: true,
  meetingNotesAutoTask: false,
  emailFlaggerSensitivity: 50,
  calName: 'Cal',

  // Calendar
  defaultEventDuration: 60,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5],
  focusBlockAutoSchedule: false,
  meetingBuffer: 0,
  calendarDefaultView: 'month',

  // Tasks
  xpHigh: 50,
  xpMedium: 30,
  xpLow: 10,
  levelTitleSet: 'rpg',
  lazyModeCount: 3,
  taskSortOrder: 'priority',
  streakRules: 'relaxed',
  dailyTaskGoal: 0,

  // Email
  emailAccessLevel: 'full',
  emailsInSummarizer: 20,
  autoSummarizeOnOpen: false,
  ignoredSenders: [],
  emailSignature: '',
  followupReminderDays: 3,

  // Voice
  voiceEnabled: true,
  autoPlayResponses: false,
  soundEffectsTask: true,
  soundEffectsCelebration: true,
  soundEffectsBriefing: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'calassist-settings' }
  )
);

// ── Derived helpers ────────────────────────────────────────────────────────────

export const THEME_ACCENTS: Record<Theme, { primary: string; secondary: string; label: string }> = {
  midnight:   { primary: '#1A56DB', secondary: '#7E3AF2', label: 'Midnight'   },
  aurora:     { primary: '#059669', secondary: '#06B6D4', label: 'Aurora'     },
  sunset:     { primary: '#D97706', secondary: '#E02424', label: 'Sunset'     },
  ocean:      { primary: '#0891B2', secondary: '#22D3EE', label: 'Ocean'      },
  monochrome: { primary: '#6B7280', secondary: '#9CA3AF', label: 'Monochrome' },
  forest:     { primary: '#15803D', secondary: '#4ADE80', label: 'Forest'     },
  rose:       { primary: '#E11D48', secondary: '#FB7185', label: 'Rose'       },
};

export const LEVEL_TITLE_SETS: Record<LevelTitleSet, string[]> = {
  rpg:          ['Rookie', 'Apprentice', 'Warrior', 'Champion', 'Legend'],
  professional: ['Intern', 'Associate', 'Manager', 'Director', 'Executive'],
  space:        ['Cadet', 'Astronaut', 'Commander', 'Captain', 'Admiral'],
};
