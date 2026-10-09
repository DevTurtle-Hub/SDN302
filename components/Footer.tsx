import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-xl relative z-10 transition-colors">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Brand & Tagline */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[1.5px] shadow-xs transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-white text-indigo-600 font-black text-xs">
                  TF
                </div>
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Task<span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Flow</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-xs text-slate-500 font-normal">
              Enterprise Workspace &amp; Project Management Platform
            </span>
          </div>

          {/* Center: Universal Navigation Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Overview
            </Link>
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Dashboard &amp; Kanban
            </Link>
            <Link href="/teams" className="hover:text-indigo-600 transition-colors">
              Team Workspaces
            </Link>
          </div>

          {/* Right: Real-time System Status */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 self-start md:self-auto shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
