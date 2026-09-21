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

  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-5">
      {/* Top summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">To Do</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{todoCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
          <p className="mt-1 text-xl font-bold text-cyan-400">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{doneCount}</p>
        </div>
      </div>

      {/* Header with filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Tasks</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {filteredTasks.length}
            </span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODO', label: 'Todo' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'DONE', label: 'Done' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                filterStatus === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 text-center backdrop-blur-sm">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute h-full w-full rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin" />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400">
            Loading tasks from Supabase...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-rose-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 text-center backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-cyan-400 mb-3 border border-slate-800">
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
          <h3 className="text-sm font-bold text-white">No tasks found</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-400">
            {filterStatus === 'ALL'
              ? 'Get started by creating your first task using the form.'
              : `No tasks currently in "${filterStatus}" status.`}
          </p>
        </div>
      )}

      {/* Task list items */}
      {!loading && !error && filteredTasks.length > 0 && (
        <ul className="space-y-3.5">
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
