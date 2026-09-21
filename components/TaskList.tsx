'use client';

import { useState } from 'react';
import TaskItem from './TaskItem';
import { TaskData } from './TaskForm';

interface TaskListProps {
  tasks: TaskData[];
  loading: boolean;
  error: string | null;
  onEdit: (task: TaskData) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onRetry: () => void;
}

export default function TaskList({
  tasks,
  loading,
  error,
  onEdit,
  onDelete,
  deletingId,
  onRetry,
}: TaskListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'ALL') return true;
    return task.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Tasks
          </h2>
          <p className="text-xs text-gray-500">
            {tasks.length} total task{tasks.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Bonus: Status Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 text-xs">
          {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {st === 'ALL'
                ? 'All'
                : st === 'TODO'
                  ? 'Todo'
                  : st === 'IN_PROGRESS'
                    ? 'In Progress'
                    : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <svg
            className="h-8 w-8 animate-spin text-indigo-600"
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
          <p className="mt-3 text-sm font-medium text-gray-600">
            Loading tasks...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No tasks found</h3>
          <p className="mt-1 text-xs text-gray-500">
            {filterStatus === 'ALL'
              ? 'Get started by creating your first task above.'
              : `No tasks with status "${filterStatus}".`}
          </p>
        </div>
      )}

      {!loading && !error && filteredTasks.length > 0 && (
        <ul className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === task.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
