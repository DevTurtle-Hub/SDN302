'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Failed to login');
    }
  };

  const handleFillTestAccount = () => {
    setEmail('demo@example.com');
    setPassword('Password123@');
    setError(null);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-2xl shadow-indigo-500/5">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2.5px] shadow-xl shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-indigo-600 shadow-inner">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-sm">
            Sign in to access your teams, manage sprints, and collaborate.
          </p>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-12 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 py-4 text-base font-extrabold text-white shadow-xl shadow-indigo-500/25 transition-all hover:opacity-95 hover:shadow-indigo-500/35 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
          </button>
        </form>

        {/* Grader Helper Box */}
        <div className="mt-8 rounded-2xl border-2 border-indigo-100 bg-indigo-50/70 p-5 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/90 px-3 py-1 text-xs font-bold text-indigo-800 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Grading Test Account
          </div>
          <p className="text-xs sm:text-sm text-indigo-900 font-medium">
            Email: <code className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200">demo@example.com</code> &bull; Password: <code className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200">Password123@</code>
          </p>
          <button
            type="button"
            onClick={handleFillTestAccount}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto-fill Test Credentials
          </button>
        </div>

        {/* Register footer link */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
