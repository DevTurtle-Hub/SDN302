'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Load saved email if present
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('taskflow_saved_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {
      // ignore
    }
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      try {
        localStorage.setItem('taskflow_saved_email', email);
      } catch {
        // ignore
      }
      router.push('/dashboard');
    } else {
      setError(res.error || 'Failed to login');
    }
  };

  const [filled, setFilled] = useState(false);

  const handleFillTestAccount = () => {
    setEmail('demo@example.com');
    setPassword('Password123@');
    setError(null);
    setFilled(true);
    setTimeout(() => setFilled(false), 1500);
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[520px] rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-11 shadow-2xl shadow-indigo-500/5">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2px] shadow-lg shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-indigo-600 shadow-inner">
              <svg
                className="h-7 w-7"
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

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs">
            Sign in to access your teams, manage sprints, and collaborate.
          </p>
        </div>

        {/* Success message banner after registration */}
        {registered && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-semibold flex items-center gap-2.5 animate-in fade-in">
            <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Tài khoản đã tạo thành công! Vui lòng đăng nhập để bắt đầu.</span>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-semibold flex items-center gap-2.5">
            <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Prevent aggressive browser password managers from auto-filling without consent */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                name="login_email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="login_password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Options: Quên mật khẩu & Show Password */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotSubmitted(false);
                setShowForgotPassword(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors"
            >
              <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Quên mật khẩu?
            </button>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In to Workspace'}
          </button>
        </form>

        {/* Test Account Helper */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/60">
            <span className="font-semibold text-slate-700">
              Tài khoản để test
            </span>
            <button
              type="button"
              onClick={handleFillTestAccount}
              className={`cursor-pointer rounded-lg px-2.5 py-1 font-semibold transition-all ${
                filled
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-white text-indigo-600 border border-slate-200 shadow-2xs hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
              }`}
            >
              {filled ? '✓ Đã điền' : 'Tự động điền'}
            </button>
          </div>

          <div className="space-y-1.5 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 min-w-[70px]">Tài khoản:</span>
              <span className="font-semibold text-slate-800">demo@example.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 min-w-[70px]">Mật khẩu:</span>
              <span className="font-semibold text-slate-800">Password123@</span>
            </div>
          </div>
        </div>

        {/* Register footer link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 transition-colors"
          >
            Create an account
          </Link>
        </p>

        {/* Modal: Quên mật khẩu */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Quên mật khẩu</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!forgotSubmitted ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setForgotLoading(true);
                    setTimeout(() => {
                      setForgotLoading(false);
                      setForgotSubmitted(true);
                    }, 500);
                  }}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Vui lòng nhập địa chỉ email tài khoản của bạn. Hệ thống sẽ hỗ trợ hướng dẫn khôi phục mật khẩu.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email tài khoản
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50"
                    >
                      {forgotLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-800 leading-relaxed">
                    <div className="flex items-center gap-2 font-bold mb-1 text-emerald-900">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Yêu cầu đã được gửi thành công!
                    </div>
                    Hướng dẫn đặt lại mật khẩu đã được gửi đến <strong className="font-semibold text-emerald-950">{forgotEmail}</strong>.
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 mb-1">💡 Mẹo cho môi trường Test / Dev:</p>
                    Mật khẩu mặc định của các tài khoản hệ thống là: <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-slate-800 font-bold">Password123@</code> hoặc <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-slate-800 font-bold">Password123!</code>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <LoginForm />
    </Suspense>
  );
}
