'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950 text-white font-black text-sm">
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                TF
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Task<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Flow</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              pathname === '/'
                ? 'bg-slate-800/80 text-cyan-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            href="/teams"
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              pathname === '/teams'
                ? 'bg-slate-800/80 text-cyan-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Teams
          </Link>
          <Link
            href="/login"
            className="ml-2 relative inline-flex items-center justify-center overflow-hidden rounded-lg p-0.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-400 transition-all"></span>
            <span className="relative rounded-[7px] bg-slate-950 px-4 py-1.5 text-slate-100 transition-colors hover:bg-transparent hover:text-white font-semibold shadow-sm">
              Login
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
