'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import {
  CheckSquare,
  LayoutDashboard,
  Users,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <div className="flex items-center flex-1 justify-start">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-transform group-hover:scale-105">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                Task<span className="text-indigo-600">Flow</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center justify-center gap-1 sm:gap-2">
          {[
            { href: '/', label: 'Home', icon: null, active: pathname === '/' },
            ...(user
              ? [
                  {
                    href: '/dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard,
                    active: pathname.startsWith('/dashboard'),
                  },
                  {
                    href: '/teams',
                    label: 'Teams',
                    icon: Users,
                    active: pathname.startsWith('/teams'),
                  },
                ]
              : []),
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-1.5 px-3.5 py-2 text-sm transition-all rounded-xl ${
                  link.active
                    ? 'text-indigo-600 font-bold bg-indigo-50/70'
                    : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Auth Buttons or User Profile */}
        <div className="flex items-center flex-1 justify-end">
          {!loading && (
            <>
              {!user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <LogIn className="h-4 w-4 text-slate-500" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Register</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                  {/* Real-time In-App Notifications Bell */}
                  <NotificationDropdown userId={user.id} />

                  <div className="hidden sm:flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
