'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/store/taskStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { cn } from '@/lib/utils';

type ViewFilter = 'today' | 'upcoming' | 'all';

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTomorrow() {
  const d = getToday();
  d.setDate(d.getDate() + 1);
  return d;
}

function getEndOfWeek() {
  const d = getToday();
  d.setDate(d.getDate() + 7);
  return d;
}

function filterTasks(tasks: Task[], view: ViewFilter): Task[] {
  const today = getToday();
  const tomorrow = getTomorrow();
  const endOfWeek = getEndOfWeek();

  if (view === 'today') {
    return tasks.filter((t) => {
      if (t.status === 'DONE') return false;
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d < tomorrow; // today and overdue
    });
  }

  if (view === 'upcoming') {
    return tasks.filter((t) => {
      if (t.status === 'DONE') return false;
      if (!t.dueDate) return true; // no due date = upcoming by default
      const d = new Date(t.dueDate);
      return d >= today && d < endOfWeek;
    });
  }

  return tasks; // all
}

export function TaskList() {
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const [view, setView] = useState<ViewFilter>('all');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filtered = useMemo(() => filterTasks(tasks, view), [tasks, view]);

  const activeTasks = filtered.filter((t) => t.status !== 'DONE');
  const doneTasks = filtered.filter((t) => t.status === 'DONE');

  const tabs: { key: ViewFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                view === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <TaskForm />

            {activeTasks.length === 0 && doneTasks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {view === 'today' ? 'No tasks due today.' : view === 'upcoming' ? 'Nothing upcoming.' : 'No tasks yet. Add one above or ask the assistant.'}
              </p>
            ) : (
              <>
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {doneTasks.length > 0 && (
                  <details className="group">
                    <summary className="text-xs text-muted-foreground cursor-pointer select-none py-2 hover:text-foreground transition-colors list-none flex items-center gap-2">
                      <span className="border-t border-border flex-1" />
                      <span>{doneTasks.length} completed</span>
                      <span className="border-t border-border flex-1" />
                    </summary>
                    <div className="mt-2 space-y-2">
                      {doneTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
