'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  members: { role: string; user: { id: string; name: string; email: string } }[];
  _count: { members: number; tasks: number };
}

const GRADIENT_PALETTES = [
  'from-indigo-600 to-violet-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-fuchsia-600',
  'from-amber-600 to-orange-600',
  'from-rose-600 to-pink-600',
];

function getTeamGradient(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

function getTeamInitials(name: string) {
  if (!name) return 'TM';
  const parts = name.trim().split(/[\s_\-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function TeamsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchTeams = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await fetch('/api/teams');
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching teams');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeams(true);
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      setShowModal(false);
      setName('');
      setDescription('');
      fetchTeams(false);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Error creating team');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Teams{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Hub
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Workspaces where you and your colleagues collaborate on tasks
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Create Team
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Grid of Teams */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">No teams found</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            You are not part of any team yet. Create one or request an Owner to add your email ({user.email}).
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            + Create a Team Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {teams.map((team) => {
            const isOwner = team.ownerId === user.id;
            return (
              <div
                key={team.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-indigo-50/20 p-5 shadow-xs backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/80 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                {/* Permanent Brand Gradient Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />

                <div className="space-y-3">
                  {/* Top Bar: Left (Avatar + Full Title) | Right (Role Badge) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Brand Logo Wrapper */}
                      <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[1.5px] shadow-sm shadow-indigo-500/20 transition-transform duration-200 group-hover:scale-105">
                        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-black text-xs tracking-wide shadow-inner">
                          {getTeamInitials(team.name)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link href={`/teams/${team.id}`} className="group/title block">
                          <h2
                            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover/title:text-indigo-600 line-clamp-2 leading-snug break-words"
                            title={team.name}
                          >
                            {team.name}
                          </h2>
                        </Link>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                          Created {new Date(team.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Role Pill */}
                    <div className="shrink-0 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                          isOwner
                            ? 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/30'
                        }`}
                      >
                        {isOwner ? (
                          <>
                            <svg className="h-3 w-3 fill-amber-500 text-amber-500" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Owner
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Member
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Team Description */}
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {team.description ? (
                      team.description
                    ) : (
                      <span className="italic text-slate-400">No description provided</span>
                    )}
                  </p>

                  {/* Compact Metrics Row: Member button + Task button + Member Avatars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      {/* Compact Member Button */}
                      <Link
                        href={`/teams/${team.id}`}
                        className="group/stat inline-flex items-center gap-1.5 rounded-lg border border-cyan-200/80 bg-cyan-50/70 px-2.5 py-1 text-xs font-semibold text-cyan-950 transition-colors hover:border-cyan-300 hover:bg-cyan-100"
                        title="View team members"
                      >
                        <svg className="h-3.5 w-3.5 text-cyan-600 transition-transform group-hover/stat:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-extrabold text-cyan-950">{team._count.members}</span>
                        <span className="text-[11px] font-medium text-cyan-700">
                          {team._count.members === 1 ? 'member' : 'members'}
                        </span>
                      </Link>

                      {/* Compact Task Button */}
                      <Link
                        href={`/teams/${team.id}`}
                        className="group/stat inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-xs font-semibold text-indigo-950 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
                        title="View team tasks"
                      >
                        <svg className="h-3.5 w-3.5 text-indigo-600 transition-transform group-hover/stat:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-extrabold text-indigo-950">{team._count.tasks}</span>
                        <span className="text-[11px] font-medium text-indigo-700">
                          {team._count.tasks === 1 ? 'task' : 'tasks'}
                        </span>
                      </Link>
                    </div>

                    {/* Member Avatars Stack */}
                    {team.members && team.members.length > 0 && (
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {team.members.slice(0, 3).map((m, idx) => (
                          <div
                            key={m.user.id || idx}
                            title={m.user.name}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-700 shadow-2xs"
                          >
                            {m.user.name ? m.user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-indigo-500 to-cyan-500 text-[9px] font-black text-white shadow-2xs">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Section: Leader + Brand CTA Button */}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-100 via-sky-100 to-cyan-100 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-200/80 shadow-2xs">
                      {team.owner.name ? team.owner.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leader</p>
                      <p className="truncate text-xs font-bold text-slate-800" title={team.owner.name}>
                        {team.owner.name}
                      </p>
                    </div>
                  </div>

                  {/* Brand CTA Button */}
                  <Link
                    href={`/teams/${team.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 transition-all duration-150 hover:shadow-md hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95"
                  >
                    <span>View Team</span>
                    <svg
                      className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Team */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Create New Team</h3>
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design Systems &amp; UX"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focus areas, goals, or sprint mission..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
