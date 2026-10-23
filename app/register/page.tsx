'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      router.push('/login?registered=true');
    } else {
      setError(res.error || 'Failed to register account');
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-[640px] rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <UserPlus className="h-7 w-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Sign up in seconds to start managing teams and collaborating on tasks.
          </p>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {/* Prevent aggressive browser password managers */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="user_fullname"
                autoComplete="off"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyen Van A"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

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
                name="user_new_email"
                autoComplete="new-password"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

          {/* Password & Confirm Password in 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  name="user_new_password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 chars"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="user_confirm_password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Show Password Toggle */}
          <div className="flex items-center justify-end pt-1">
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
                Creating account...
              </span>
            ) : (
              <>
                <span>Create Workspace Account</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
