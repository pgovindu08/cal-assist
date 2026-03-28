'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';

export function ChatInput() {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const { sendMessage, isLoading } = useChatStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    setValue('');
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimText('');
      return;
    }

    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true; // Show text as you speak
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }

      if (final) {
        setValue((prev) => (prev ? `${prev} ${final}` : final).trim());
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // What to show in the textarea
  const displayValue = isRecording && interimText
    ? (value ? `${value} ${interimText}` : interimText)
    : value;

  return (
    <div className="border-t border-border bg-background px-4 py-4">
      {/* Recording indicator */}
      {isRecording && (
        <div className="mb-2 flex items-center gap-2 text-xs text-destructive">
          <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Listening… speak now
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-input bg-secondary/30 px-4 py-2 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-shadow">
        <textarea
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[36px] max-h-32 py-1"
          placeholder={isRecording ? 'Listening…' : 'Type a message or describe an event...'}
          rows={1}
          value={displayValue}
          onChange={(e) => {
            if (!isRecording) setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Chat message input"
          style={{ color: isRecording && interimText ? 'hsl(var(--muted-foreground))' : undefined }}
        />
        <div className="flex items-center gap-1 shrink-0 pb-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isRecording ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={toggleVoice}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
