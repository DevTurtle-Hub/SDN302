'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Left: Brand Logo */}
        <div className="flex items-center flex-1 justify-start">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2px] shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white text-indigo-600 font-black text-sm shadow-inner">
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  TF
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Task<span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Flow</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center justify-center gap-1 sm:gap-2">
          {[
            { href: '/', label: 'Home', active: pathname === '/' },
            ...(user
              ? [
                  { href: '/dashboard', label: 'Dashboard', active: pathname.startsWith('/dashboard') },
                  { href: '/teams', label: 'Teams', active: pathname.startsWith('/teams') },
                ]
              : []),
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-center px-3.5 py-2 text-sm transition-all duration-200 rounded-lg ${
                link.active
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>{link.label}</span>
              {/* Gentle, sleek underline indicator */}
              {link.active ? (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-9 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/20" />
              ) : (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-0 rounded-full bg-slate-300/60 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:opacity-100" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Action: Auth Buttons or User Profile */}
        <div className="flex items-center flex-1 justify-end">
          {!loading && (
            <>
              {!user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="relative inline-flex items-center justify-center overflow-hidden rounded-lg p-[1.5px] text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-indigo-500/20"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />
                    <span className="relative rounded-[7px] bg-indigo-600 px-3.5 py-1.5 text-white transition-colors hover:bg-indigo-700 font-semibold">
                      Register
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-xs font-bold text-white shadow-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {loggingOut ? 'Logging out...' : 'Logout'}
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
