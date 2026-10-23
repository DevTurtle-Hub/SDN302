import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam } from '@/lib/realtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const globalForTyping = globalThis as unknown as {
  typingStore: Map<string, Map<string, { name: string; timestamp: number }>> | undefined;
};

const typingStore =
  globalForTyping.typingStore ??
  new Map<string, Map<string, { name: string; timestamp: number }>>();

if (process.env.NODE_ENV !== 'production') {
  globalForTyping.typingStore = typingStore;
}

// GET: Query active typing users for a team
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: teamId } = await context.params;
    let teamMap = typingStore.get(teamId);
    if (!teamMap) {
      teamMap = new Map();
      typingStore.set(teamId, teamMap);
    }

    const now = Date.now();
    const activeTyping: { [userId: string]: string } = {};

    for (const [userId, data] of teamMap.entries()) {
      if (now - data.timestamp < 3500) {
        activeTyping[userId] = data.name;
      } else {
        teamMap.delete(userId);
      }
    }

    return NextResponse.json(
      { typingUsers: activeTyping },
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

// POST: Update current user's typing state
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { isTyping } = body;

    let teamMap = typingStore.get(teamId);
    if (!teamMap) {
      teamMap = new Map();
      typingStore.set(teamId, teamMap);
    }

    if (isTyping) {
      teamMap.set(user.id, { name: user.name, timestamp: Date.now() });
    } else {
      teamMap.delete(user.id);
    }

    // Broadcast typing state to team
    await broadcastToTeam(teamId, 'chat:typing', {
      userId: user.id,
      name: user.name,
      isTyping: Boolean(isTyping),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

