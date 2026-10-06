'use client';

import { useEffect, useState, useMemo, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  teamId: string;
  creatorId: string | null;
  assigneeId: string | null;
  createdAt: string;
  creator?: { id: string; name: string; email: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tasks: TaskItem[];
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');

  // Search & Filters for Tasks
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Member management state
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(null);

  // Edit Team state
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  // Task Modal state (Create / Edit)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load team');
      }
      const data: TeamDetail = await res.json();
      setTeam(data);
      setEditTeamName(data.name);
      setEditTeamDescription(data.description || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading team');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchTeamDetails();
    }
  }, [user, id, fetchTeamDetails]);

  const isOwner = Boolean(user && team && team.ownerId === user.id);

  // Handle Edit Team info
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeam(true);
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName,
          description: editTeamDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update team');
      setTeam((prev) => (prev ? { ...prev, name: data.name, description: data.description } : null));
      setShowEditTeamModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating team');
    } finally {
      setSavingTeam(false);
    }
  };

  // Handle Delete Team
  const handleDeleteTeam = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this team? All associated members and tasks will be removed permanently.',
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete team');
      }
      router.push('/teams');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting team');
    }
  };

  // Add Member by Email
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberActionError(null);
    setMemberActionSuccess(null);
    setAddingMember(true);

    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addMemberEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setMemberActionSuccess(`Member '${data.user.name}' added successfully!`);
      setAddMemberEmail('');
      fetchTeamDetails();
    } catch (err: unknown) {
      setMemberActionError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setAddingMember(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId: string, memberName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove '${memberName}' from this team?`,
    );
    if (!confirmed) return;

    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const res = await fetch(`/api/teams/${id}/members/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');

      setMemberActionSuccess(`Removed '${memberName}' from team.`);
      fetchTeamDetails();
    } catch (err: unknown) {
      setMemberActionError(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  // Open Task Modal for Create
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskStatus('TODO');
    setTaskPriority('MEDIUM');
    setTaskDueDate('');
    setTaskAssigneeId('');
    setTaskModalError(null);
    setShowTaskModal(true);
  };

  // Open Task Modal for Edit
  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    setTaskAssigneeId(task.assigneeId || '');
    setTaskModalError(null);
    setShowTaskModal(true);
  };

  // Submit Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskModalError(null);
    setSavingTask(true);

    try {
      const payload = {
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assigneeId: taskAssigneeId || null,
      };

      if (editingTask) {
        // PUT /api/tasks/:id
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update task');
      } else {
        // POST /api/teams/:id/tasks
        const res = await fetch(`/api/teams/${id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create task');
      }

      setShowTaskModal(false);
      fetchTeamDetails();
    } catch (err: unknown) {
      setTaskModalError(err instanceof Error ? err.message : 'Error saving task');
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: TaskItem) => {
    const canDelete =
      user &&
      (user.id === task.creatorId ||
        user.id === task.assigneeId ||
        user.id === team?.ownerId);

    if (!canDelete) {
      alert('Only the task creator, the assignee, or the team Owner can delete this task.');
      return;
    }

    const confirmed = window.confirm(`Delete task "${task.title}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');

      fetchTeamDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting task');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (!team) return [];
    return team.tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [team, searchQuery, statusFilter, priorityFilter]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-32">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Team not found'}</h2>
        <p className="mt-1 text-sm text-slate-500">
          You may not have permission to view this workspace or it has been deleted.
        </p>
        <div className="mt-6">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            &larr; Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/teams" className="hover:text-indigo-600 transition-colors">
          Teams
        </Link>
        <span>/</span>
        <span className="text-slate-900 line-clamp-1">{team.name}</span>
      </nav>

      {/* Team Header Banner */}
      <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isOwner
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isOwner ? 'Workspace Owner' : 'Team Member'}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">
                Owner: <strong className="text-slate-800">{team.owner.name}</strong> ({team.owner.email})
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              {team.name}
            </h1>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {team.description || 'No description provided for this team.'}
            </p>
          </div>

          {/* Action Buttons for Team Owner */}
          {isOwner && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowEditTeamModal(true)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Edit Team
              </button>
              <button
                onClick={handleDeleteTeam}
                className="cursor-pointer rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow-xs hover:bg-red-50 transition-colors"
              >
                Delete Team
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex border-b border-slate-100 gap-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'tasks'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tasks ({team.tasks.length})
            {activeTab === 'tasks' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'members'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Members ({team.members.length})
            {activeTab === 'members' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ======================= TAB: TASKS ======================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, View Mode, Create Task */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              {/* View Toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1.5 transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kanban
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenCreateTask}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              + Create Task
            </button>
          </div>

          {/* Task Content: List vs Kanban */}
          {filteredTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
              <p className="text-sm font-semibold text-slate-600">No tasks match your criteria</p>
              <button
                onClick={handleOpenCreateTask}
                className="mt-3 cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                + Add a task to this team
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List / Table View */
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <div className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const canDelete =
                    user &&
                    (user.id === task.creatorId ||
                      user.id === task.assigneeId ||
                      user.id === team.ownerId);

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              task.status === 'DONE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'IN_PROGRESS'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>

                          {/* Priority Badge */}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              task.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'MEDIUM'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>

                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>
                            Assignee:{' '}
                            <strong className="text-slate-700">
                              {task.assignee ? task.assignee.name : 'Unassigned'}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Created by:{' '}
                            <strong className="text-slate-700">
                              {task.creator ? task.creator.name : 'Unknown'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEditTask(task)}
                          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Kanban Board View (Bonus Feature) */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((colStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === colStatus);
                const colTitle =
                  colStatus === 'TODO'
                    ? 'To Do'
                    : colStatus === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Done';

                return (
                  <div
                    key={colStatus}
                    className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 shadow-2xs"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            colStatus === 'DONE'
                              ? 'bg-emerald-500'
                              : colStatus === 'IN_PROGRESS'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                          }`}
                        />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          {colTitle}
                        </h4>
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs border border-slate-200">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 min-h-[220px]">
                      {columnTasks.map((task) => {
                        const canDelete =
                          user &&
                          (user.id === task.creatorId ||
                            user.id === task.assigneeId ||
                            user.id === team.ownerId);

                        return (
                          <div
                            key={task.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow"
                          >
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                  task.priority === 'HIGH'
                                    ? 'bg-rose-100 text-rose-800'
                                    : task.priority === 'MEDIUM'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            <h5 className="text-sm font-bold text-slate-900 line-clamp-2">
                              {task.title}
                            </h5>

                            {task.description && (
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                              <span className="truncate max-w-[120px]">
                                {task.assignee ? task.assignee.name : 'Unassigned'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold"
                                >
                                  Edit
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteTask(task)}
                                    className="cursor-pointer text-red-500 hover:text-red-700 font-bold"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB: MEMBERS ======================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Member notification feedback */}
          {memberActionSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 font-semibold">
              {memberActionSuccess}
            </div>
          )}
          {memberActionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 font-semibold">
              {memberActionError}
            </div>
          )}

          {/* Add Member Form (Owner only) */}
          {isOwner && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <h3 className="text-sm font-black text-indigo-950">Add Member to Workspace</h3>
              <p className="mt-0.5 text-xs text-indigo-700">
                Type the email address of a registered user to invite them into this team.
              </p>

              <form onSubmit={handleAddMember} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={addingMember}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Team Members ({team.members.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {team.members.map((member) => {
                const isMemberOwner = member.userId === team.ownerId;
                const canRemove = isOwner && !isMemberOwner;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-sm font-black text-white shadow-xs">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {member.user.name}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              isMemberOwner
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isMemberOwner ? 'Owner' : 'Member'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>

                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="cursor-pointer rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CREATE / EDIT TASK ======================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingTask ? 'Edit Task Details' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {taskModalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {taskModalError}
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task specification, details, and acceptance criteria..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) =>
                      setTaskStatus(e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE')
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {team.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {savingTask
                    ? 'Saving...'
                    : editingTask
                      ? 'Update Task'
                      : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT TEAM INFO ======================= */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Edit Team Info</h3>
              <button
                onClick={() => setShowEditTeamModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditTeamModal(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTeam}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {savingTeam ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
