'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 px-4 py-1.5 text-xs font-bold text-indigo-700 mb-6 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          Assignment 2 &bull; Task &amp; Team Management with Auth
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl leading-tight">
          Collaborate seamlessly with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Teams &amp; Tasks
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          An enterprise-grade workspace management platform. Create teams, invite collaborators by email, assign tasks, and track sprint progression with role-based authorization.
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
              >
                Go to Workspace Dashboard
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Browse Teams
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
              >
                Get Started Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Sign In to Account
              </Link>
            </>
          )}
        </div>

        {/* Demo Account Indicator */}
        <div className="mt-6 text-xs text-slate-500">
          Grading Test Account: <code className="font-semibold text-slate-700">demo@example.com</code> / <code className="font-semibold text-slate-700">Password123@</code>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-5">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900">Secure Authentication</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Encrypted password hashing with Bcrypt, stateless JWT tokens with HTTP-only cookies, and instant self-registration for frictionless grading.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 mb-5">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900">Team Workspaces &amp; RBAC</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Create multi-user workspaces. Owners can invite members by email, manage roles (Owner &bull; Member), and safeguard workspace settings.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900">Task Management &amp; Kanban</h3>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Assign tasks to teammates, set priorities and deadlines, toggle between Table and Kanban views, with strict Creator/Assignee/Owner deletion rules.
          </p>
        </div>
      </div>
    </div>
  );
}
