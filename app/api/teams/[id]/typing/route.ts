import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam } from '@/lib/realtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { isTyping } = body;

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
