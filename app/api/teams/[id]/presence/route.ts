import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const globalForPresence = globalThis as unknown as {
  presenceStore: Map<string, Map<string, number>> | undefined;
};

const presenceStore =
  globalForPresence.presenceStore ?? new Map<string, Map<string, number>>();

if (process.env.NODE_ENV !== 'production') {
  globalForPresence.presenceStore = presenceStore;
}

// Helper to get online users for a team
function getOnlineUserIds(teamId: string, currentUserId?: string): string[] {
  let teamMap = presenceStore.get(teamId);
  if (!teamMap) {
    teamMap = new Map<string, number>();
    presenceStore.set(teamId, teamMap);
  }

  const now = Date.now();
  const online: string[] = [];

  for (const [userId, lastSeen] of teamMap.entries()) {
    // Active within last 25 seconds
    if (now - lastSeen < 25000) {
      online.push(userId);
    } else {
      teamMap.delete(userId);
    }
  }

  if (currentUserId && !online.includes(currentUserId)) {
    online.push(currentUserId);
  }

  return online;
}

// GET: Check which team members are currently online
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    // Refresh current user's presence
    let teamMap = presenceStore.get(teamId);
    if (!teamMap) {
      teamMap = new Map<string, number>();
      presenceStore.set(teamId, teamMap);
    }
    teamMap.set(user.id, Date.now());

    const onlineUserIds = getOnlineUserIds(teamId, user.id);

    return NextResponse.json(
      { onlineUserIds },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// POST: Heartbeat ping to mark user as online in team
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    let teamMap = presenceStore.get(teamId);
    if (!teamMap) {
      teamMap = new Map<string, number>();
      presenceStore.set(teamId, teamMap);
    }

    teamMap.set(user.id, Date.now());
    const onlineUserIds = getOnlineUserIds(teamId, user.id);

    return NextResponse.json(
      { success: true, onlineUserIds },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
