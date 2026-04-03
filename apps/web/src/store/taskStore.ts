import { create } from 'zustand';
import { api } from '@/lib/api';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence: string | null;
  googleTaskId: string | null;
  linkedEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  recurrence?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/tasks');
      set({ tasks: data.data.tasks, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      set({ error: e.response?.data?.error?.message ?? 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (input) => {
    const { data } = await api.post('/tasks', input);
    const task = data.data.task as Task;
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, input) => {
    const { data } = await api.patch(`/tasks/${id}`, input);
    const updated = data.data.task as Task;
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
