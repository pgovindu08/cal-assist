'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, clearAuth } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      clearAuth();
      router.replace('/login?error=auth_failed');
      return;
    }

    // Store token in Zustand, then fetch user profile
    // Temporarily set token so the me() call works
    useAuthStore.setState({ accessToken: token });

    api
      .get('/auth/me')
      .then(({ data }) => {
        setAuth(data.data.user, token);
        router.replace('/chat');
      })
      .catch(() => {
        clearAuth();
        router.replace('/login?error=auth_failed');
      });
  }, [searchParams, router, setAuth, clearAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
