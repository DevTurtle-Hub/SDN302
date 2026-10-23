'use client';

import { useEffect, useState, useMemo, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TeamChat from '@/components/TeamChat';
import TeamActivity from '@/components/TeamActivity';
import { subscribeToTeamChannel } from '@/lib/realtime-client';
import {
  Crown,
  Shield,
  ShieldCheck,
  User,
  Users,
  CheckSquare,
  MessageSquare,
  History,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';


interface Member {
  id: string;
  userId: string;
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
  const { user, loading: authLoading, logout } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [allUserTeams, setAllUserTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'members' | 'activity'>('tasks');

  // Search & Filters for Tasks
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Member management state
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
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
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);
  const [isTaskReadOnly, setIsTaskReadOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchTeamDetails = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const res = await fetch(`/api/teams/${id}`);
      if (res.status === 401) {
        await logout();
        return;
      }
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
      if (showSpinner) setLoading(false);
    }
  }, [id, logout]);

  useEffect(() => {
    if (user && id) {
      fetchTeamDetails(true);
      fetch('/api/teams')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setAllUserTeams(data))
        .catch(() => {});
    }
  }, [user, id, fetchTeamDetails]);

  // Background auto-sync every 3s (ensures multi-user updates on Vercel without manual refresh)
  useEffect(() => {
    if (!user || !id) return;
    const interval = setInterval(() => {
      fetchTeamDetails(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [user, id, fetchTeamDetails]);

  // ======================= REAL-TIME COLLABORATION SUBSCRIPTION (Pusher / SSE) =======================
  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = subscribeToTeamChannel(id, {
      'task:created': (newTask: TaskItem) => {
        setTeam((prev) => {
          if (!prev) return prev;
          if (prev.tasks.some((t) => t.id === newTask.id)) return prev;
          return {
            ...prev,
            tasks: [newTask, ...prev.tasks],
          };
        });
      },
      'task:updated': (updatedTask: TaskItem) => {
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          };
        });
      },
      'task:deleted': ({ id: deletedId }: { id: string }) => {
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== deletedId),
          };
        });
      },
      'member:added': (newMember: Member) => {
        setTeam((prev) => {
          if (!prev) return prev;
          if (prev.members.some((m) => m.id === newMember.id)) return prev;
          return {
            ...prev,
            members: [...prev.members, newMember],
          };
        });
      },
      'member:updated': (updatedMember: Member) => {
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.userId === updatedMember.userId ? updatedMember : m,
            ),
          };
        });
      },
      'member:removed': ({ userId: removedUserId }: { userId: string }) => {
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.filter((m) => m.userId !== removedUserId),
          };
        });
      },
      'team:updated': (updatedTeam: Partial<TeamDetail>) => {
        setTeam((prev) =>
          prev
            ? {
                ...prev,
                name: updatedTeam.name || prev.name,
                description: updatedTeam.description !== undefined ? updatedTeam.description : prev.description,
              }
            : prev,
        );
      },
    });

    return unsubscribe;
  }, [id, user]);

  // ======================= ROLE CALCULATIONS (RBAC) =======================
  const currentUserMembership = useMemo(() => {
    if (!team || !user) return null;
    return team.members.find((m) => m.userId === user.id) || null;
  }, [team, user]);

  const isOwner = Boolean(user && team && team.ownerId === user.id);
  const isAdmin = Boolean(!isOwner && currentUserMembership?.role === 'ADMIN');
  const isMember = Boolean(!isOwner && !isAdmin);

  const canManageMembers = isOwner || isAdmin;
  const canManageAllTasks = isOwner || isAdmin;
  const canEditTeam = isOwner || isAdmin;
  const canDeleteTeam = isOwner; // strictly owner only

  const canEditTask = useCallback(
    (task: TaskItem) => {
      if (!user) return false;
      if (canManageAllTasks) return true;
      return task.creatorId === user.id || task.assigneeId === user.id;
    },
    [user, canManageAllTasks],
  );

  const canDeleteTask = useCallback(
    (task: TaskItem) => {
      if (!user) return false;
      if (canManageAllTasks) return true;
      return task.creatorId === user.id || task.assigneeId === user.id;
    },
    [user, canManageAllTasks],
  );

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

  // Handle Delete Team (Owner only)
  const handleDeleteTeam = async () => {
    if (!isOwner) {
      alert('Only the Team Owner can delete this workspace.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this team? All associated tasks, members, and chat history will be permanently deleted.',
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

  // Add Member by Email with Role
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberActionError(null);
    setMemberActionSuccess(null);
    setAddingMember(true);

    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addMemberEmail,
          role: addMemberRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setMemberActionSuccess(`Member '${data.user.name}' added with role ${data.role}!`);
      setAddMemberEmail('');
      setAddMemberRole('MEMBER');
      fetchTeamDetails(false);
    } catch (err: unknown) {
      setMemberActionError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setAddingMember(false);
    }
  };

  // Change Member Role (Owner & Admin)
  const handleUpdateMemberRole = async (targetUserId: string, targetName: string, newRole: string) => {
    setMemberActionError(null);
    setMemberActionSuccess(null);
    setUpdatingRoleUserId(targetUserId);

    try {
      const res = await fetch(`/api/teams/${id}/members/${targetUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');

      setMemberActionSuccess(`Updated role for ${targetName} to ${newRole}!`);
      setTeam((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m.userId === targetUserId ? { ...m, role: newRole } : m,
              ),
            }
          : prev,
      );
    } catch (err: unknown) {
      setMemberActionError(err instanceof Error ? err.message : 'Error updating member role');
    } finally {
      setUpdatingRoleUserId(null);
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
      setTeam((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.userId !== userId),
            }
          : prev,
      );
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

  // Open Task Modal for Edit (or View Only if user cannot edit)
  const handleOpenEditTask = useCallback(
    (task: TaskItem) => {
      const userCanEdit = canEditTask(task);
      setIsTaskReadOnly(!userCanEdit);
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
      setTaskAssigneeId(task.assigneeId || '');
      setTaskModalError(null);
      setShowTaskModal(true);
    },
    [canEditTask],
  );

  // Open and highlight task by ID (from URL query param or notification click)
  const openTaskById = useCallback(
    (taskId: string) => {
      if (!team) return;
      const target = team.tasks.find((t) => t.id === taskId);
      if (target) {
        setActiveTab('tasks');
        handleOpenEditTask(target);
        setTimeout(() => {
          const el = document.getElementById(`task-${taskId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-indigo-500/50');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-indigo-500/50');
            }, 3000);
          }
        }, 150);
      }
    },
    [team, handleOpenEditTask],
  );

  // Automatically open task if taskId is present in URL search params
  useEffect(() => {
    if (!team || team.tasks.length === 0) return;
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetTaskId = urlParams.get('taskId');
    if (targetTaskId) {
      openTaskById(targetTaskId);
    }
  }, [team, openTaskById]);

  // Listen to notification navigate custom events while already on the page
  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ link: string }>;
      const link = customEvent.detail?.link;
      if (link && link.includes('taskId=')) {
        const match = link.match(/taskId=([^&]+)/);
        if (match && match[1]) {
          openTaskById(match[1]);
        }
      }
    };

    window.addEventListener('notification:navigate', handleNavEvent);
    return () => window.removeEventListener('notification:navigate', handleNavEvent);
  }, [openTaskById]);


  // Quick move Kanban column status
  const handleQuickStatusChange = async (task: TaskItem, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!canEditTask(task)) {
      alert('Permission denied. You can only move your own tasks, unless you are an Owner or Admin.');
      return;
    }

    // Optimistic UI update
    setTeam((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
          }
        : prev,
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update task status');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update task status');
      fetchTeamDetails(false);
    }
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
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update task');

        setTeam((prev) =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map((t) => (t.id === data.id ? data : t)),
              }
            : prev,
        );
      } else {
        const res = await fetch(`/api/teams/${id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create task');

        setTeam((prev) =>
          prev
            ? {
                ...prev,
                tasks: [data, ...prev.tasks],
              }
            : prev,
        );
      }

      setShowTaskModal(false);
    } catch (err: unknown) {
      setTaskModalError(err instanceof Error ? err.message : 'Error saving task');
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: TaskItem) => {
    if (deletingTaskId) return;

    if (!canDeleteTask(task)) {
      alert('Only the task creator, the assignee, or an Owner/Admin can delete this task.');
      return;
    }

    const confirmed = window.confirm(`Delete task "${task.title}"?`);
    if (!confirmed) return;

    setDeletingTaskId(task.id);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');

      setTeam((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== task.id),
            }
          : prev,
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting task');
      fetchTeamDetails(false);
    } finally {
      setDeletingTaskId(null);
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

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading team workspace...</p>
        </div>
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation & Team Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <nav className="flex items-center gap-2 font-semibold text-slate-500">
          <Link href="/teams" className="hover:text-indigo-600 transition-colors">
            Teams
          </Link>
          <span>/</span>
          <span className="text-slate-900 line-clamp-1">{team.name}</span>
        </nav>

        {allUserTeams.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Switch Team:</span>
            <select
              value={id}
              onChange={(e) => router.push(`/teams/${e.target.value}`)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-indigo-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {allUserTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.id === id ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Team Header Banner */}
      <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isOwner
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : isAdmin
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isOwner ? (
                  <span className="inline-flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-amber-700" /> Workspace Owner</span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-indigo-700" /> Team Admin</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-600" /> Team Member</span>
                )}
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

          {/* Action Buttons for Owner / Admin */}
          <div className="flex shrink-0 items-center gap-2">
            {canEditTeam && (
              <button
                onClick={() => setShowEditTeamModal(true)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Edit Team
              </button>
            )}
            {canDeleteTeam && (
              <button
                onClick={handleDeleteTeam}
                className="cursor-pointer rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow-xs hover:bg-red-50 transition-colors"
                title="Only Workspace Owner can delete the team"
              >
                Delete Team
              </button>
            )}
          </div>
        </div>

        {/* RBAC Role Indicator Banner */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200">
                {isOwner ? <Crown className="h-4 w-4 text-amber-700" /> : isAdmin ? <Shield className="h-4 w-4 text-indigo-700" /> : <User className="h-4 w-4 text-slate-600" />}
              </span>
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Your Current Role: <span className="text-indigo-600 uppercase font-black">{isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {isOwner && 'Full administrative authority: manage members, assign roles, edit all tasks, and delete workspace.'}
                  {isAdmin && 'Team management authority: add/remove members, promote/demote roles, manage all tasks (cannot delete team).'}
                  {isMember && 'Collaborator access: create tasks, manage your assigned tasks, participate in live chat & view task boards.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700">Real-time Connected</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex border-b border-slate-100 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks ({team.tasks.length})</span>
            {activeTab === 'tasks' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Team Chat</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === 'members'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Members & Roles ({team.members.length})</span>
            {activeTab === 'members' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`cursor-pointer pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === 'activity'
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><History className="h-4 w-4" /> Activity Log</span>
            {activeTab === 'activity' && (
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
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle: Kanban vs List */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Create Task Button */}
              <button
                onClick={handleOpenCreateTask}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-cyan-700 transition-all"
              >
                <Plus className="h-4 w-4" /> New Task
              </button>
            </div>
          </div>

          {/* Task Feed */}
          {filteredTasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or active filters.'
                  : 'Get started by creating your team’s first sprint task.'}
              </p>
              <button
                onClick={handleOpenCreateTask}
                className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                + Create Task
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List / Table View */
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <div className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const editable = canEditTask(task);
                  const deletable = canDeleteTask(task);

                  return (
                    <div
                      key={task.id}
                      id={`task-${task.id}`}
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center hover:bg-slate-50/70 transition-all rounded-xl"
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
                              <Calendar className="h-3 w-3 text-slate-400" />
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => handleOpenEditTask(task)}
                          className="text-base font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer transition-colors"
                        >
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
                          {editable ? 'Edit' : 'View Details'}
                        </button>
                        {deletable && (
                          <button
                            onClick={() => handleDeleteTask(task)}
                            disabled={deletingTaskId === task.id}
                            className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  );

                })}
              </div>
            </div>
          ) : (
            /* Live-updating Kanban Board View */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((colStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === colStatus);
                const colTitle =
                  colStatus === 'TODO'
                    ? 'To Do'
                    : colStatus === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Done';

                const colBg =
                  colStatus === 'TODO'
                    ? 'bg-slate-50/70 border-slate-200'
                    : colStatus === 'IN_PROGRESS'
                      ? 'bg-amber-50/40 border-amber-200/80'
                      : 'bg-emerald-50/40 border-emerald-200/80';

                const badgeBg =
                  colStatus === 'TODO'
                    ? 'bg-slate-200 text-slate-700'
                    : colStatus === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800';

                return (
                  <div
                    key={colStatus}
                    className={`flex flex-col rounded-2xl border ${colBg} p-4 min-h-[460px]`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{colTitle}</h4>
                        <span
                          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${badgeBg}`}
                        >
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Cards */}
                    <div className="flex-1 space-y-3">
                      {columnTasks.map((task) => {
                        const editable = canEditTask(task);
                        const deletable = canDeleteTask(task);

                        return (
                          <div
                            key={task.id}
                            id={`task-${task.id}`}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-all"
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

                            <h5
                              onClick={() => handleOpenEditTask(task)}
                              className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                            >
                              {task.title}
                            </h5>

                            {task.description && (
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Quick move column buttons for real-time task board */}
                            {editable && (
                              <div className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2 text-[10px]">
                                <span className="text-slate-400 font-semibold mr-1">Move:</span>
                                {colStatus !== 'TODO' && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, 'TODO')}
                                    className="cursor-pointer rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 hover:bg-slate-200"
                                  >
                                    &larr; To Do
                                  </button>
                                )}
                                {colStatus !== 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, 'IN_PROGRESS')}
                                    className="cursor-pointer rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 hover:bg-amber-200"
                                  >
                                    In Progress
                                  </button>
                                )}
                                {colStatus !== 'DONE' && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, 'DONE')}
                                    className="cursor-pointer rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800 hover:bg-emerald-200"
                                  >
                                    Done &rarr;
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                              <span className="truncate max-w-[120px]">
                                {task.assignee ? task.assignee.name : 'Unassigned'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold"
                                >
                                  {editable ? 'Edit' : 'View'}
                                </button>
                                {deletable && (
                                  <button
                                    onClick={() => handleDeleteTask(task)}
                                    disabled={deletingTaskId === task.id}
                                    className="cursor-pointer text-red-500 hover:text-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
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

      {/* ======================= TAB: TEAM CHAT ======================= */}
      {activeTab === 'chat' && user && (
        <TeamChat
          teamId={id}
          currentUser={user}
          teamMembers={[
            {
              userId: team.ownerId,
              role: 'OWNER',
              name: team.owner.name,
              email: team.owner.email,
            },
            ...team.members
              .filter((m) => m.userId !== team.ownerId)
              .map((m) => ({
                userId: m.userId,
                role: m.role,
                name: m.user.name,
                email: m.user.email,
              })),
          ]}
        />

      )}

      {/* ======================= TAB: MEMBERS & ROLES ======================= */}
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

          {/* Add Member Form (Owner & Admin only) */}
          {canManageMembers && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Users className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-black text-indigo-950">Add Member to Team</h3>
              </div>
              <p className="mt-1 text-xs text-indigo-700 leading-relaxed">
                Add an existing registered user by their email address and assign an initial role (Member or Admin).
              </p>

              <form onSubmit={handleAddMember} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter user email (e.g. member@example.com)"
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                <select
                  value={addMemberRole}
                  onChange={(e) => setAddMemberRole(e.target.value as 'MEMBER' | 'ADMIN')}
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="MEMBER">Role: Member</option>
                  <option value="ADMIN">Role: Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={addingMember}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </form>

              {/* Sample accounts helper */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-600"><Sparkles className="h-3 w-3 text-indigo-600" /> Quick test accounts:</span>
                {['admin@example.com', 'member@example.com'].map((email) => {
                  const already = team.members.some((m) => m.user.email === email);
                  if (already) return null;
                  return (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setAddMemberEmail(email)}
                      className="cursor-pointer rounded-md bg-white px-2 py-0.5 font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                    >
                      {email}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members List with Role Management */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Team Members & Role Access Control ({team.members.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {team.members.map((member) => {
                const isMemberOwner = member.userId === team.ownerId;
                const isMemberAdmin = member.role === 'ADMIN';

                // Permission to change role: Owner can change any non-owner; Admin can change members (cannot change owner or other admins)
                const canChangeRole =
                  !isMemberOwner &&
                  (isOwner || (isAdmin && member.role === 'MEMBER'));

                // Permission to remove member: Owner can remove any non-owner; Admin can remove regular members only
                const canRemove =
                  !isMemberOwner &&
                  (isOwner || (isAdmin && member.role === 'MEMBER'));

                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-slate-50/70 transition-colors"
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

                          {/* Role Badge */}
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              isMemberOwner
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : isMemberAdmin
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isMemberOwner ? (
                                <span className="inline-flex items-center gap-1"><Crown className="h-3 w-3 text-amber-700" /> Owner</span>
                              ) : isMemberAdmin ? (
                                <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-indigo-700" /> Admin</span>
                              ) : (
                                <span className="inline-flex items-center gap-1"><User className="h-3 w-3 text-slate-600" /> Member</span>
                              )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>
                    </div>

                    {/* Member Controls (Role changer & Remove) */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Role Dropdown (Owner & Admin only) */}
                      {canChangeRole ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-semibold">Role:</span>
                          <select
                            disabled={updatingRoleUserId === member.userId}
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateMemberRole(
                                member.userId,
                                member.user.name,
                                e.target.value,
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-indigo-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      )}

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

      {/* ======================= TAB: ACTIVITY LOG ======================= */}
      {activeTab === 'activity' && <TeamActivity teamId={id} />}

      {/* ======================= MODAL: CREATE / EDIT TASK ======================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingTask
                  ? isTaskReadOnly
                    ? 'Task Details (View Only)'
                    : 'Edit Task Details'
                  : 'Create New Task'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
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
                  disabled={isTaskReadOnly}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  disabled={isTaskReadOnly}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task specification, details, and acceptance criteria..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={isTaskReadOnly}
                    value={taskStatus}
                    onChange={(e) =>
                      setTaskStatus(e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE')
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
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
                    disabled={isTaskReadOnly}
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
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
                    disabled={isTaskReadOnly}
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {team.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.user.email}) [{m.role}]
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
                    disabled={isTaskReadOnly}
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {isTaskReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isTaskReadOnly && (
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
                )}
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT TEAM INFO ======================= */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Edit Team Info</h3>
              <button
                onClick={() => setShowEditTeamModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
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
