'use client';

import { useState } from 'react';
import { Check, Trash2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/store/taskStore';
import { useTaskStore } from '@/store/taskStore';
import { Button } from '@/components/ui/button';

const PRIORITY_COLORS = {
  LOW: 'text-blue-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-red-400',
};

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isPast = date < today && !isToday;

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (isPast ? ' (overdue)' : '');
}

function isDueDatePast(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isDone = task.status === 'DONE';
  const dueDateLabel = formatDueDate(task.dueDate);
  const overdue = !isDone && isDueDatePast(task.dueDate);

  const cycleStatus = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const next: Record<TaskStatus, TaskStatus> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'TODO',
    };
    try {
      await updateTask(task.id, { status: next[task.status] });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
  };

  return (
    <div className={cn(
      'group flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 transition-colors',
      isDone && 'opacity-60',
    )}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          disabled={isUpdating}
          className="mt-0.5 shrink-0 focus:outline-none"
          title={`Status: ${task.status}`}
        >
          {isDone ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : task.status === 'IN_PROGRESS' ? (
            <Circle className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium leading-snug', isDone && 'line-through text-muted-foreground')}>
            {task.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {/* Priority indicator */}
            <span className={cn('flex items-center gap-1', PRIORITY_COLORS[task.priority])}>
              <AlertCircle className="h-3 w-3" />
              {PRIORITY_LABELS[task.priority]}
            </span>

            {/* Due date */}
            {dueDateLabel && (
              <span className={cn('flex items-center gap-1', overdue && 'text-red-400')}>
                <Clock className="h-3 w-3" />
                {dueDateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Expand / delete */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && task.notes && (
        <p className="ml-8 text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</p>
      )}
    </div>
  );
}
