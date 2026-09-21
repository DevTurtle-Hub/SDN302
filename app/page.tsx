'use client';

import { useEffect, useState } from 'react';
import TaskForm, { TaskData } from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

export default function HomePage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error('Failed to load tasks from server');
      }
      const data = await res.json();
      setTasks(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to load tasks from server');
        const data = await res.json();
        if (!ignore) {
          setTasks(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load tasks.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleFormSuccess = (task: TaskData, isEdit: boolean) => {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setEditingTask(null);
    } else {
      setTasks((prev) => [task, ...prev]);
    }
  };

  const handleEdit = (task: TaskData) => {
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingTask?.id === id) {
        setEditingTask(null);
      }
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : 'An error occurred while deleting',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero Header with Dual Gradient */}
      <div className="mb-10 flex flex-col items-center text-center sm:items-start sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-3 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          Technical Foundation &bull; Assignment 1
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Task &amp; Team{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Management
          </span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
          Orchestrate workflows with ease. Powered by Next.js App Router, Prisma ORM, and Supabase PostgreSQL.
        </p>
      </div>

      {/* Main Grid: Form on Left, Tasks on Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <TaskForm
              onSuccess={handleFormSuccess}
              editingTask={editingTask}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>

        {/* Right Column: Task List */}
        <div className="lg:col-span-7">
          <TaskList
            tasks={tasks}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
            onRetry={fetchTasks}
          />
        </div>
      </div>
    </div>
  );
}
