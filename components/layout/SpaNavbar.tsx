import Link from 'next/link';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { MobileMenu } from './MobileMenu';
import { Avatar } from '@/components/ui/Avatar';
import type { CurrentUser } from '@/lib/services/authService';

interface SpaNavbarProps {
  current?: CurrentUser | null;
}

export function SpaNavbar({ current }: SpaNavbarProps) {
  const isAuthenticated = Boolean(current);
  const isAdmin = current?.profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">Serenity Spa</span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-slate-700 md:flex">
          <Link href="/services" className="hover:text-sky-700">Services</Link>
          <Link href="/about" className="hover:text-sky-700">About</Link>
          <Link href="/contact" className="hover:text-sky-700">Contact</Link>
        </nav>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block">Dashboard</Link>
              <div className="flex items-center gap-2">
                <Avatar
                  src={current?.profile?.avatar_url ?? null}
                  name={current?.profile?.name ?? ''}
                  size="sm"
                />
                <Link href="/profile" className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block">Profile</Link>
              </div>
              {isAdmin && (
                <Link href="/admin" className="hidden rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100 md:inline-block">Admin</Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-full px-3 py-1 text-slate-700 hover:bg-slate-100">Login</Link>
              <Link href="/auth/register" className="hidden rounded-full bg-sky-600 px-3 py-1 font-medium text-white shadow-sm hover:bg-sky-700 md:inline-block">Sign up</Link>
            </>
          )}
          <MobileMenu isLoggedIn={isAuthenticated} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
