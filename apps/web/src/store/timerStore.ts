import { create } from 'zustand';

interface TimerState {
  taskId:      string | null;
  taskTitle:   string | null;
  endTime:     number | null;   // epoch ms when timer ends
  durationMs:  number | null;   // original duration in ms (for progress bar)
  isRunning:   boolean;

  startTimer:      (taskId: string, taskTitle: string, minutes: number) => void;
  stopTimer:       () => void;
  getRemainingMs:  () => number;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  taskId:     null,
  taskTitle:  null,
  endTime:    null,
  durationMs: null,
  isRunning:  false,

  startTimer: (taskId, taskTitle, minutes) => {
    const durationMs = minutes * 60 * 1000;
    set({
      taskId,
      taskTitle,
      endTime:    Date.now() + durationMs,
      durationMs,
      isRunning:  true,
    });
  },

  stopTimer: () =>
    set({ taskId: null, taskTitle: null, endTime: null, durationMs: null, isRunning: false }),

  getRemainingMs: () => {
    const { endTime } = get();
    if (!endTime) return 0;
    return Math.max(0, endTime - Date.now());
  },
}));
