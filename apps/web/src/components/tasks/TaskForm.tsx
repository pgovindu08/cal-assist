'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/taskStore';
import type { TaskPriority } from '@/store/taskStore';

export function TaskForm({ onClose }: { onClose?: () => void } = {}) {
  const { createTask } = useTaskStore();
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
      });
      setTitle('');
      setNotes('');
      setDueDate('');
      setPriority('MEDIUM');
      setIsOpen(false);
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.12] bg-[#1A1D2E] p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full bg-transparent text-xs text-muted-foreground outline-none resize-none placeholder:text-muted-foreground/60"
      />
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-transparent text-xs text-muted-foreground outline-none [color-scheme:dark]"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="bg-transparent text-xs text-muted-foreground outline-none"
        >
          <option value="LOW">Low priority</option>
          <option value="MEDIUM">Medium priority</option>
          <option value="HIGH">High priority</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim() || isSubmitting}>
          Add task
        </Button>
      </div>
    </form>
  );
}
