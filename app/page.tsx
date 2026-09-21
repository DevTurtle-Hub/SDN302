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
    // Smoothly scroll to the top of the form
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Task &amp; Team Management
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Manage your tasks efficiently, collaborate seamlessly with your team, and track progress all in one place.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
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
