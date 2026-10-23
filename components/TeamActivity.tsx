'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToTeamChannel } from '@/lib/realtime-client';
import {
  History,
  PlusCircle,
  Edit3,
  Trash2,
  Users,
  ShieldAlert,
  Clock,
  Activity,
} from 'lucide-react';

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
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <PlusCircle className="h-4 w-4" />
          </span>
        );
      case 'UPDATED_TASK':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Edit3 className="h-4 w-4" />
          </span>
        );
      case 'DELETED_TASK':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <Trash2 className="h-4 w-4" />
          </span>
        );
      case 'ADDED_MEMBER':
      case 'REMOVED_MEMBER':
      case 'CHANGED_ROLE':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Users className="h-4 w-4" />
          </span>
        );
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Activity className="h-4 w-4" />
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
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Team Activity Log & Audit Trail ({activities.length})
            </h3>
            <p className="text-xs text-slate-500">Live chronological record of all team events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600">Live Synchronized</span>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading activity trail...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activities recorded yet.</div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/70 transition-colors">
              {getActionBadge(act.action)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">
                    {act.user?.name || 'Someone'}
                  </p>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatTime(act.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
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
