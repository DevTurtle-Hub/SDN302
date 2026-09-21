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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all">
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            {isEditing ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Title <span className="text-indigo-600">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design team dashboard architecture"
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
          />
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Description
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add relevant context, checklist, or deliverables..."
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="task-status"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatusType)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-xs transition-all focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-priority"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TaskPriorityType)
              }
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-xs transition-all focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="task-due-date"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-all focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          {isEditing && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancelEdit}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                {isEditing ? 'Saving changes...' : 'Creating task...'}
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
