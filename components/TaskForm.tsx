'use client';

import { useState } from 'react';

export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate: string | null;
  createdAt: string;
}

interface TaskFormProps {
  onSuccess: (task: TaskData, isEdit: boolean) => void;
  editingTask?: TaskData | null;
  onCancelEdit?: () => void;
}

export default function TaskForm({
  onSuccess,
  editingTask,
  onCancelEdit,
}: TaskFormProps) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(
    editingTask?.description || '',
  );
  const [status, setStatus] = useState<TaskStatusType>(
    editingTask?.status || 'TODO',
  );
  const [priority, setPriority] = useState<TaskPriorityType>(
    editingTask?.priority || 'MEDIUM',
  );
  const [dueDate, setDueDate] = useState(
    editingTask?.dueDate
      ? new Date(editingTask.dueDate).toISOString().split('T')[0]
      : '',
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = !!editingTask;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage('Task title is required');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const url = isEditing ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save task');
      }

      onSuccess(data, isEditing);

      if (!isEditing) {
        setTitle('');
        setDescription('');
        setStatus('TODO');
        setPriority('MEDIUM');
        setDueDate('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {isEditing ? 'Edit Task' : 'Create Task'}
        </h2>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study Next.js App Router"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more context or notes for this task..."
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="task-status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatusType)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="block text-sm font-medium text-gray-700"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TaskPriorityType)
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-due-date"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {isEditing && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancelEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                {isEditing ? 'Saving...' : 'Creating...'}
              </span>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
