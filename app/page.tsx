'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyTestAccount = () => {
    navigator.clipboard.writeText('demo@example.com\nPassword123@');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="relative flex-1 flex flex-col justify-center overflow-hidden">
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-200/40 via-sky-100/30 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-[350px] -right-20 w-[600px] h-[600px] bg-cyan-100/40 blur-[140px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12 py-3 lg:py-4">
        {/* =========================================================================
            HERO: 2-COLUMN SPLIT (ENGLISH LOCALIZATION)
           ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: 3D Illustration (Contained to viewport) */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center order-2 lg:order-1">
            <div className="relative w-full flex items-center justify-center">
              {/* Soft ambient halo */}
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                <div className="h-[280px] w-[420px] rounded-full bg-gradient-to-tr from-indigo-200/40 via-cyan-100/40 to-transparent blur-[80px]" />
              </div>

              {/* 3D Transparent Illustration: max-height ensures it fits on 1 screen */}
              <img
                src="/images/hero-tasks.png"
                alt="TaskFlow 3D Productivity Objects & Kanban Cards"
                className="w-full max-h-[45vh] xl:max-h-[50vh] max-w-[560px] xl:max-w-[640px] object-contain select-none pointer-events-none drop-shadow-sm"
              />
            </div>
          </div>

          {/* Right Column: Professional Text Column */}
          <div className="lg:col-span-6 xl:col-span-6 text-center lg:text-left space-y-3.5 xl:space-y-4 order-1 lg:order-2">
            {/* Enterprise Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/95 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>Next-Gen Task &amp; Team Management Platform</span>
            </div>

            {/* Sharp, Bold Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-[1.14]">
              Manage Tasks &amp;
              <br className="hidden sm:inline" />
              {' '}Collaborate Teams with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </h1>

            {/* Elegant Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-lg mx-auto lg:mx-0">
              An intuitive workspace platform to connect collaborators, enforce role-based authorization (RBAC), and accelerate sprint progression with real-time Kanban boards.
            </p>

            {/* Professional Value Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">
                  ✓
                </span>
                <span>Role-based access (Owner &bull; Member)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 text-[10px] font-bold">
                  ✓
                </span>
                <span>Real-time Kanban &amp; Sprint tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">
                  ✓
                </span>
                <span>Stateless HTTP-only JWT &amp; Bcrypt</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  ✓
                </span>
                <span>Invite teammates via email</span>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              {!loading && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5.5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Go to Workspace Dashboard</span>
                    <span className="text-xs">&rarr;</span>
                  </Link>
                  <Link
                    href="/teams"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4.5 py-3 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    Manage Teams
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5.5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Get Started Free</span>
                    <span className="text-xs">&rarr;</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4.5 py-3 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    Sign In to Account
                  </Link>
                </>
              )}
            </div>

            {/* Logged in User Bar or Demo Account Copy */}
            {!loading && user ? (
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 pt-0.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span>Signed in as: <strong className="text-slate-800">{user.name}</strong> ({user.email})</span>
              </div>
            ) : (
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 pt-0.5">
                <span>Grading test account:</span>
                <button
                  onClick={handleCopyTestAccount}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
                  title="Click to copy test credentials"
                >
                  <span>demo@example.com / Password123@</span>
                  <span className="text-indigo-600 font-semibold">{copySuccess ? '(Copied!)' : ''}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
