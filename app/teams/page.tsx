'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Plus,
  Search,
  CheckSquare,
  ArrowRight,
  X,
  Calendar,
  Crown,
  Sparkles,
} from 'lucide-react';

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  members: { role: string; user: { id: string; name: string; email: string } }[];
  _count: { members: number; tasks: number };
  createdAt?: string;
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      t.owner.name.toLowerCase().includes(q)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
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
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Teams <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Workspaces where you and your colleagues collaborate on tasks
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name, description, or owner..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 self-end sm:self-center">
          Showing {filteredTeams.length} of {teams.length} teams
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery ? 'No matching teams found' : 'No teams yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search query or clear the filter.'
              : 'Create a team to start assigning tasks, tracking progress, and chatting in real-time.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Team</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const gradient = getTeamGradient(team.name);
            const initials = getTeamInitials(team.name);
            const isOwner = team.ownerId === user.id;

            return (
              <div
                key={team.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div>
                  {/* Top Bar: Icon & Owner Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${gradient} text-lg font-black text-white shadow-md`}
                    >
                      {initials}
                    </div>

                    {isOwner ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800 border border-amber-200">
                        <Crown className="h-3 w-3 text-amber-700" />
                        OWNER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                        <Users className="h-3 w-3 text-slate-500" />
                        MEMBER
                      </span>
                    )}
                  </div>

                  {/* Team Info */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {team.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                    {team.description || 'No description provided for this team.'}
                  </p>

                  {/* Stats Badges */}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{team._count.members} members</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{team._count.tasks} tasks</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner</p>
                    <p className="truncate text-xs font-bold text-slate-800">{team.owner.name}</p>
                  </div>

                  <Link
                    href={`/teams/${team.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                  >
                    <span>Enter Team</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Team - WIDE & CLEAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create New Team</h3>
                  <p className="text-xs text-slate-500">Set up a shared workspace for collaboration</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI & Cloud Development Team"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Team Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your team's mission, goals, or sprint scope..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{submitting ? 'Creating...' : 'Create Team'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
