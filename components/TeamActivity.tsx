'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToTeamChannel } from '@/lib/realtime-client';

export interface ActivityItem {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TeamActivity({ teamId }: { teamId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data || []);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Real-time listener for incoming activities (Pusher / SSE)
  useEffect(() => {
    const unsubscribe = subscribeToTeamChannel(teamId, {
      'activity:created': (newAct: ActivityItem) => {
        setActivities((prev) => [newAct, ...prev]);
      },
    });

    return unsubscribe;
  }, [teamId]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATED_TASK':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </span>
        );
      case 'UPDATED_TASK':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
        );
      case 'DELETED_TASK':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </span>
        );
      case 'ADDED_MEMBER':
      case 'REMOVED_MEMBER':
      case 'CHANGED_ROLE':
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
            📜
          </span>
          <h3 className="text-sm font-black text-slate-900">
            Team Activity Log & Audit Trail ({activities.length})
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          Real-time live updates
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading activity trail...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No activities recorded yet.</div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/60 transition-colors">
              {getActionBadge(act.action)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">
                    {act.user?.name || 'Someone'}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {formatTime(act.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {act.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
