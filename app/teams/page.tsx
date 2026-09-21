import Link from 'next/link';

export default function TeamsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2px] shadow-xl shadow-indigo-500/20">
        <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white text-indigo-600 shadow-inner">
          <svg
            className="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      </div>

      <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 shadow-xs">
        Assignment 2 Preview
      </span>

      <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
        Teams{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
          Hub
        </span>
      </h1>

      <p className="mt-4 text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
        Coming Soon
      </p>

      <p className="mt-4 max-w-md text-sm sm:text-base text-slate-600 leading-relaxed">
        Team collaboration workspaces, member role assignments, and shared task boards are currently queued for development in Assignment 2.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Tasks
        </Link>
      </div>
    </div>
  );
}
