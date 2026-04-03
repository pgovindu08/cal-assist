'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

type Mode = 'login' | 'register';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Google SVG ─────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 533.5 544.3" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.2H272v95h146.9c-6.3 33.9-25 62.5-53.2 81.8v68.1h85.8c50.2-46.3 82-114.6 82-194.7z" fill="#4285F4" />
      <path d="M272 544.3c71.6 0 131.7-23.7 175.7-64.2l-85.8-68.1c-23.8 16-54.1 25.4-89.9 25.4-69.1 0-127.6-46.6-148.4-109.3h-89.6v68.9C77.7 480.5 168.5 544.3 272 544.3z" fill="#34A853" />
      <path d="M123.6 328.1c-10.8-32.1-10.8-66.9 0-99l-89.6-68.9c-39.1 77.6-39.1 168.3 0 245.9l89.6-68z" fill="#FBBC05" />
      <path d="M272 107.7c37.4-.6 73.5 13.2 101.1 38.7l75.4-75.4C403.4 24.5 341.4 0 272 0 168.5 0 77.7 63.8 34 159.2l89.6 68.9C144.4 154.3 202.9 107.7 272 107.7z" fill="#EA4335" />
    </svg>
  );
}

// ── Input field ────────────────────────────────────────────────────────────────

function Field({
  id, label, type = 'text', placeholder, value, onChange, required, autoComplete,
  rightSlot,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  required?: boolean; autoComplete?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all pr-10"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={e => { e.currentTarget.style.border = '1px solid rgba(var(--cal-primary-rgb, 26,86,219), 0.7)'; }}
          onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; }}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

// ── Social button ──────────────────────────────────────────────────────────────

function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AuthForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const { data } = await api.post(endpoint, body);
      setAuth(data.data.user, data.data.accessToken);
      router.replace('/briefing');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const switchMode = (m: Mode) => { setMode(m); setError(''); };

  return (
    <div className="w-full space-y-6">
      {/* Mode toggle tabs */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {(['login', 'register'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: mode === m ? 'var(--cal-primary, #1A56DB)' : 'transparent',
              color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
            }}
          >
            {m === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence initial={false}>
          {mode === 'register' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Field
                id="name" label="Full Name" placeholder="Alex Johnson"
                value={name} onChange={setName}
                required autoComplete="name"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          id="email" label="Email" type="email" placeholder="alex@example.com"
          value={email} onChange={setEmail}
          required autoComplete="email"
        />

        <Field
          id="password" label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
          value={password} onChange={setPassword}
          required autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {mode === 'login' && (
          <div className="text-right">
            <button type="button" className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--cal-primary, #1A56DB)' }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(224,36,36,0.1)', color: '#E02424', border: '1px solid rgba(224,36,36,0.2)' }}
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
          style={{ background: 'var(--cal-primary, #1A56DB)' }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.28)' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Social buttons */}
      <div className="space-y-3">
        <SocialButton
          icon={<GoogleIcon />}
          label="Continue with Google"
          onClick={handleGoogleSignIn}
        />
      </div>

      {/* Switch mode link */}
      <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {mode === 'login' ? (
          <>Don&apos;t have an account?{' '}
            <button type="button" onClick={() => switchMode('register')}
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--cal-primary, #1A56DB)' }}>
              Sign up free
            </button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')}
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--cal-primary, #1A56DB)' }}>
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
