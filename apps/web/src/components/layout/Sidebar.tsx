'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, CalendarDays, CheckSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const navItems = [
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside className="flex h-full w-16 flex-col items-center justify-between border-r border-border bg-card py-4">
      {/* Logo */}
      <div className="flex flex-col items-center gap-6">
        <Link href="/chat" className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          CA
        </Link>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="icon"
                title={label}
                aria-label={label}
                className={cn(
                  'h-10 w-10',
                  pathname.startsWith(href) && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* User + Logout */}
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          title="Logout"
          aria-label="Logout"
          onClick={handleLogout}
          className="h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? 'User'} />
          <AvatarFallback className="text-xs">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
