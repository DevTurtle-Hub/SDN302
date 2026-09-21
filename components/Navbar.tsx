'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
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

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              pathname === '/'
                ? 'bg-indigo-50/80 text-indigo-600 shadow-xs border border-indigo-200/60 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Home
          </Link>
          <Link
            href="/teams"
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              pathname === '/teams'
                ? 'bg-indigo-50/80 text-indigo-600 shadow-xs border border-indigo-200/60 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Teams
          </Link>
          <Link
            href="/login"
            className="ml-2 relative inline-flex items-center justify-center overflow-hidden rounded-lg p-[1.5px] text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-indigo-500/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500"></span>
            <span className="relative rounded-[7px] bg-white px-4 py-1.5 text-indigo-600 transition-colors hover:bg-transparent hover:text-white font-semibold">
              Login
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
