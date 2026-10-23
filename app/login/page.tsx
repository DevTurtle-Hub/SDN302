'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

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

  const handleFillTestAccount = (accountEmail = 'demo@example.com') => {
    setEmail(accountEmail);
    setPassword('Password123@');
    setError(null);
    setFilled(true);
    setTimeout(() => setFilled(false), 1500);
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[620px] rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <LogIn className="h-7 w-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Sign in to access your teams, collaborate in real-time, and manage tasks.
          </p>
        </div>

        {/* Success message banner after registration */}
        {registered && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-semibold flex items-center gap-3">
            <Check className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>Tài khoản đã tạo thành công! Vui lòng đăng nhập để bắt đầu.</span>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Prevent aggressive browser password managers from auto-filling without consent */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                name="login_email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="login_password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-12 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
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
              <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
              Quên mật khẩu?
            </button>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Show password
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Test Accounts Box */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-xs">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Tài khoản mẫu để chấm bài (Assignment 3 & 4)
            </span>
            <button
              type="button"
              onClick={() => handleFillTestAccount('demo@example.com')}
              className={`cursor-pointer rounded-xl px-3 py-1.5 font-bold transition-all flex items-center gap-1.5 ${
                filled
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-white text-indigo-600 border border-slate-200 shadow-xs hover:bg-indigo-50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {filled ? 'Đã điền' : 'Tự động điền (Owner)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
            <div
              onClick={() => handleFillTestAccount('demo@example.com')}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between font-bold text-indigo-600 mb-1">
                <span>Account 1 (Owner)</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                  OWNER
                </span>
              </div>
              <p className="font-mono text-slate-800 font-medium">demo@example.com</p>
              <p className="text-[11px] text-slate-400">Pass: Password123@</p>
            </div>

            <div
              onClick={() => handleFillTestAccount('admin@example.com')}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between font-bold text-indigo-600 mb-1">
                <span>Account 2 (Admin)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black">
                  ADMIN
                </span>
              </div>
              <p className="font-mono text-slate-800 font-medium">admin@example.com</p>
              <p className="text-[11px] text-slate-400">Pass: Password123@</p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quên mật khẩu?</h3>
                  <p className="text-xs text-slate-500">Lấy lại quyền truy cập tài khoản của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Yêu cầu đã được ghi nhận!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Nếu email <strong className="text-slate-800">{forgotEmail}</strong> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-4 w-full cursor-pointer rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  Đóng và quay lại đăng nhập
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotLoading(true);
                  setTimeout(() => {
                    setForgotLoading(false);
                    setForgotSubmitted(true);
                  }, 800);
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi mã xác thực để bạn tạo mật khẩu mới.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email của bạn
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {forgotLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex-1 flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
