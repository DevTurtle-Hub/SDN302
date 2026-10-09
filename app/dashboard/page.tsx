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

interface AssignedTask {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  team: { id: string; name: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [taskStatusFilter, setTaskStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Create Team Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);

  // Protection: Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const loadDashboardData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      // Fetch teams and assigned tasks in parallel
      const [teamsRes, tasksRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/tasks'),
      ]);

      if (teamsRes.status === 401 || tasksRes.status === 401) {
        await logout();
        return;
      }

      if (!teamsRes.ok) throw new Error('Failed to load teams data');
      if (!tasksRes.ok) throw new Error('Failed to load tasks data');

      const [teamsData, tasksData] = await Promise.all([
        teamsRes.json(),
        tasksRes.json(),
      ]);

      setTeams(teamsData);
      setTasks(tasksData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Quick update task status directly from dashboard
  const handleUpdateStatus = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      setUpdatingTaskId(taskId);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTeamError(null);
    setCreatingTeam(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      loadDashboardData(false);
    } catch (err: unknown) {
      setCreateTeamError(err instanceof Error ? err.message : 'Error creating new team');
    } finally {
      setCreatingTeam(false);
    }
  };

  // Calculations
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // Filtered task list
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
    const matchesSearch =
      taskSearchQuery.trim() === '' ||
      t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      (t.team?.name && t.team.name.toLowerCase().includes(taskSearchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-[1440px] items-center justify-center py-40 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Ambient background glow accent (brand Indigo) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-indigo-100/60 via-sky-50/40 to-transparent blur-[130px] rounded-full" />
      </div>

      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8 animate-in fade-in duration-150">
        {/* =========================================================================
            HEADER SECTION (SPACIOUS & MODERN)
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Workspace Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user.name}
            </h1>
            <p className="text-base text-slate-600 mt-1 font-normal">
              Monitor your team workspaces, sprint workload, and task progression in real time.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Team
            </button>
            <Link
              href="/teams"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
            >
              Browse Teams
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadDashboardData()}
              className="text-xs font-bold underline hover:text-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            STAT CARDS (PERMANENT SIGNATURE BLUE BORDER ON TOP 4 CARDS ONLY)
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Workspaces */}
          <div className="rounded-2xl border border-indigo-400 bg-white p-6 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Workspaces
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {teams.length}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Active workspaces</span>
                <Link
                  href="/teams"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  View all &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Metric 2: In Progress */}
          <div className="rounded-2xl border border-indigo-400 bg-white p-6 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                In Progress
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {inProgressTasks.length}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Active WIP tasks</span>
                <button
                  onClick={() => setTaskStatusFilter('IN_PROGRESS')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Filter tasks &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Metric 3: Pending Tasks */}
          <div className="rounded-2xl border border-indigo-400 bg-white p-6 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Tasks
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {todoTasks.length}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Awaiting action</span>
                <button
                  onClick={() => setTaskStatusFilter('TODO')}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Filter to-do &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Metric 4: Completed Tasks */}
          <div className="rounded-2xl border border-indigo-400 bg-white p-6 shadow-xs hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Completed
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {doneTasks.length}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  / {tasks.length} ({completionRate}%)
                </span>
              </div>
              {/* Refined Brand Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2-COLUMN WORKSPACE: TASKS (7 COLS) & TEAMS (5 COLS)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Assigned Tasks (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
              {/* Header with Title and Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      Assigned Tasks
                    </h2>
                    <span className="rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-3 py-0.5 text-xs font-bold">
                      {filteredTasks.length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage priority, deadlines, and status across all your teams.
                  </p>
                </div>

                {/* Status Filter Segmented Control */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm self-start sm:self-auto">
                  {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setTaskStatusFilter(status)}
                      className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
                        taskStatusFilter === status
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {status === 'ALL' && 'All'}
                      {status === 'TODO' && 'To Do'}
                      {status === 'IN_PROGRESS' && 'In Progress'}
                      {status === 'DONE' && 'Done'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacious Search Input */}
              <div className="pt-4 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="Search tasks by title or team name..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
                  />
                  <svg
                    className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {taskSearchQuery && (
                    <button
                      onClick={() => setTaskSearchQuery('')}
                      className="absolute right-3.5 top-3 text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-800">No tasks found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {taskSearchQuery
                      ? `No tasks match "${taskSearchQuery}". Try clearing search.`
                      : 'You currently have no tasks assigned in this status.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 sm:p-5 rounded-xl border border-indigo-400 bg-white hover:border-indigo-500 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {task.title}
                          </span>

                          {/* Priority Pill */}
                          <span
                            className={`rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              task.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : task.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Team Pill */}
                          {task.team && (
                            <Link
                              href={`/teams/${task.team.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200/70 hover:bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 transition-colors"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                              {task.team.name}
                            </Link>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-500">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-500">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{task.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="self-start sm:self-center shrink-0">
                        <select
                          disabled={updatingTaskId === task.id}
                          value={task.status}
                          onChange={(e) =>
                            handleUpdateStatus(
                              task.id,
                              e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE'
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 cursor-pointer transition-all shadow-2xs"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Workspaces (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Team Workspaces Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    Your Team Workspaces
                  </h3>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 px-2.5 py-0.5 text-xs font-bold">
                    {teams.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors"
                >
                  + New Team
                </button>
              </div>

              {teams.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-800">No workspaces yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Create your first workspace to start collaborating on sprints and tasks.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-xs transition-colors"
                  >
                    Create Workspace
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => {
                    const isOwner = team.ownerId === user.id;
                    return (
                      <div
                        key={team.id}
                        className="p-4 sm:p-5 rounded-xl border border-indigo-400 bg-white hover:border-indigo-500 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/teams/${team.id}`}
                                className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                              >
                                {team.name}
                              </Link>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                  isOwner
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {isOwner ? 'Owner' : 'Member'}
                              </span>
                            </div>
                            {team.description && (
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {team._count.members} member{team._count.members !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {team._count.tasks} task{team._count.tasks !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <Link
                            href={`/teams/${team.id}`}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            Open Team &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions & Shortcuts Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Quick Actions &amp; Shortcuts
              </h4>
              <div className="space-y-3">
                <Link
                  href="/teams"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-400 bg-white hover:border-indigo-500 hover:bg-indigo-50/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Browse All Workspaces
                      </div>
                      <div className="text-xs text-slate-500">
                        Manage members, roles, and project settings
                      </div>
                    </div>
                  </div>
                  <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </Link>

                {teams.length > 0 && (
                  <Link
                    href={`/teams/${teams[0].id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-400 bg-white hover:border-indigo-500 hover:bg-indigo-50/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Sprint Kanban Board
                        </div>
                        <div className="text-xs text-slate-500">
                          Jump straight to {teams[0].name}&apos;s board
                        </div>
                      </div>
                    </div>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                      &rarr;
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CREATE TEAM MODAL (ELEGANT INDIGO ACCENT)
           ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-100">
              <div className="mb-5 flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Create New Workspace</h3>
                    <p className="text-xs text-slate-500">You will be assigned as Workspace Owner.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createTeamError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {createTeamError}
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Engineering Core, Design Systems"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Brief description of the workspace and sprint scope..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTeam}
                    className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                  >
                    {creatingTeam ? 'Creating Workspace...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
