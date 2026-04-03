'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { api } from '@/lib/api';
import { ArrowUp, Mic, MicOff, CalendarDays, CheckSquare, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils';

// ── CalAssist-specific suggestion categories ─────────────────────────────────

const SUGGESTIONS = {
  schedule: [
    'Schedule a dentist appointment next Thursday at 3pm',
    'Set up a team standup every Monday at 9am',
    'Book a lunch meeting with Alex tomorrow at noon',
    'Add a 1-hour gym session this Friday at 6am',
    'Create a reminder for my flight next Tuesday',
  ],
  tasks: [
    'Remind me to review the Q2 report by Friday',
    'Add a task to call the bank tomorrow',
    'Create a high-priority task to submit the proposal',
    'Add "Buy groceries" to my tasks for today',
    'Create a recurring task: water plants every Monday',
  ],
  query: [
    'What do I have scheduled this week?',
    'Show me all events for today',
    'What tasks are due tomorrow?',
    'Am I free on Friday afternoon?',
    "What's on my calendar next Monday?",
  ],
};

type Category = keyof typeof SUGGESTIONS;

interface CategoryButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function CategoryButton({ icon, label, isActive, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all',
        isActive
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
      )}
    >
      {icon}
      <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
        {label}
      </span>
    </motion.button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ChatInput() {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const { sendMessage, isLoading, messages } = useChatStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmpty = messages.length === 0;

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue('');
    setActiveCategory(null);
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setValue(text);
    setActiveCategory(null);
    inputRef.current?.focus();
  };

  const toggleVoice = async () => {
    setVoiceError(null);

    // Stop if already recording
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // Start recording
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError('Microphone access denied. Click the lock icon in your browser address bar and allow microphone access.');
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all tracks to release the microphone
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];

      if (blob.size < 1000) return; // too short, skip

      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const res = await api.post<{ success: boolean; data?: { text: string } }>(
          '/chat/transcribe',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        const text = res.data.data?.text?.trim();
        if (text) {
          setValue((prev) => (prev ? `${prev} ${text}` : text).trim());
        }
      } catch {
        setVoiceError('Transcription failed. Please try again.');
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const displayValue = value;

  // ── Shared input box ────────────────────────────────────────────────────────

  const inputBox = (
    <div className={cn(
      'w-full rounded-2xl border bg-card shadow-sm overflow-hidden transition-shadow',
      'border-border focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
    )}>
      {/* Recording / error indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 pt-3 text-xs text-destructive"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Recording… click the mic to stop.
          </motion.div>
        )}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 pt-3 text-xs text-muted-foreground"
          >
            <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Transcribing…
          </motion.div>
        )}
        {!isRecording && !isTranscribing && voiceError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-2 px-4 pt-3 text-xs text-destructive"
          >
            <span>{voiceError}</span>
            <button onClick={() => setVoiceError(null)} className="shrink-0 hover:opacity-70">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text input */}
      <div className="px-4 pt-4 pb-2">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => { if (!isRecording) setValue(e.target.value); }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={isRecording ? 'Recording…' : isTranscribing ? 'Transcribing…' : 'Ask me to schedule, add a task, or query your calendar…'}
          className={cn(
            'w-full bg-transparent text-sm outline-none',
            'placeholder:text-muted-foreground text-foreground',
            isTranscribing && 'text-muted-foreground',
          )}
          aria-label="Chat message input"
        />
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Category quick-picks inline */}
          <button
            onClick={() => setActiveCategory(activeCategory === 'schedule' ? null : 'schedule')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeCategory === 'schedule'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Schedule
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'tasks' ? null : 'tasks')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeCategory === 'tasks'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Tasks
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'query' ? null : 'query')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeCategory === 'query'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Query
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleVoice}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              isRecording
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              value.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <ul className="divide-y divide-border">
              {SUGGESTIONS[activeCategory].map((s, i) => (
                <motion.li
                  key={s}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {s}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Empty state: full centered interface ────────────────────────────────────

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10"
          >
            <CalendarDays className="h-8 w-8 text-primary" />
          </motion.div>

          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 text-center"
          >
            <h1 className="text-2xl font-bold text-foreground">
              What can I help you with?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Schedule events, manage tasks, or ask what&apos;s on your calendar — just type naturally.
            </p>
          </motion.div>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="w-full mb-5"
          >
            {inputBox}
          </motion.div>

          {/* Category cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="w-full grid grid-cols-3 gap-3"
          >
            <CategoryButton
              icon={<CalendarDays className="h-5 w-5" />}
              label="Schedule"
              isActive={activeCategory === 'schedule'}
              onClick={() => setActiveCategory(activeCategory === 'schedule' ? null : 'schedule')}
            />
            <CategoryButton
              icon={<CheckSquare className="h-5 w-5" />}
              label="Tasks"
              isActive={activeCategory === 'tasks'}
              onClick={() => setActiveCategory(activeCategory === 'tasks' ? null : 'tasks')}
            />
            <CategoryButton
              icon={<Search className="h-5 w-5" />}
              label="Query"
              isActive={activeCategory === 'query'}
              onClick={() => setActiveCategory(activeCategory === 'query' ? null : 'query')}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── With messages: compact bottom bar ──────────────────────────────────────

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      {inputBox}
    </div>
  );
}
