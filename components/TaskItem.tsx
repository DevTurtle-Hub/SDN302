'use client';

import { TaskData, TaskPriorityType, TaskStatusType } from './TaskForm';

interface TaskItemProps {
  task: TaskData;
  onEdit: (task: TaskData) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const statusConfig: Record<
  TaskStatusType,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  TODO: {
    label: 'Todo',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  DONE: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const priorityConfig: Record<
  TaskPriorityType,
  { label: string; badge: string }
> = {
  LOW: {
    label: 'Low',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  HIGH: {
    label: 'High',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export default function TaskItem({
  task,
  onEdit,
  onDelete,
  isDeleting,
}: TaskItemProps) {
  const currentStatus = statusConfig[task.status] || statusConfig.TODO;
  const currentPriority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const formattedCreatedAt = new Date(task.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );

  return (
    <li className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Left status indicator bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          task.status === 'DONE'
            ? 'bg-emerald-500'
            : task.status === 'IN_PROGRESS'
              ? 'bg-gradient-to-b from-indigo-500 to-cyan-400'
              : 'bg-amber-400'
        }`}
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start pl-2">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
              {currentStatus.label}
            </span>

            <span
              className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${currentPriority.badge}`}
            >
              {currentPriority.label} Priority
            </span>

            {formattedDueDate && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <svg
                  className="h-3.5 w-3.5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Due {formattedDueDate}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 tracking-tight break-words group-hover:text-indigo-600 transition-colors">
            {task.title}
          </h3>

          {/* Description */}
          {task.description ? (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">
              {task.description}
            </p>
          ) : (
            <p className="mt-2 text-xs italic text-slate-400">
              No additional details provided
            </p>
          )}

          {/* Created date footer */}
          <div className="mt-3.5 flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <span>Created on {formattedCreatedAt}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={() => onEdit(task)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-bold text-rose-600 shadow-xs transition-all hover:bg-rose-100 hover:text-rose-700 focus:outline-none disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}
