'use client';

import { TaskData, TaskPriorityType, TaskStatusType } from './TaskForm';

interface TaskItemProps {
  task: TaskData;
  onEdit: (task: TaskData) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const statusColors: Record<TaskStatusType, string> = {
  TODO: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  DONE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const statusLabels: Record<TaskStatusType, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'DONE',
};

const priorityColors: Record<TaskPriorityType, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-rose-100 text-rose-800',
};

export default function TaskItem({
  task,
  onEdit,
  onDelete,
  isDeleting,
}: TaskItemProps) {
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
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[task.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[task.status] || task.status}
            </span>

            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                priorityColors[task.priority] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {task.priority} Priority
            </span>

            {formattedDueDate && (
              <span className="inline-flex items-center text-xs text-gray-500">
                <svg
                  className="mr-1 h-3.5 w-3.5 text-gray-400"
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

          <h3 className="text-base font-semibold text-gray-900 break-words">
            {task.title}
          </h3>

          {task.description ? (
            <p className="mt-1.5 text-sm text-gray-600 whitespace-pre-line break-words">
              {task.description}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-gray-400">
              No description provided
            </p>
          )}

          <div className="mt-3 text-xs text-gray-400">
            Created on {formattedCreatedAt}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={() => onEdit(task)}
            disabled={isDeleting}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 focus:outline-none disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}
