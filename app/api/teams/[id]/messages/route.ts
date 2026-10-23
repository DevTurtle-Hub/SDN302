import { NextRequest, NextResponse } from 'next/server';
import { prisma, withSchemaFallback } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam } from '@/lib/realtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Fetch message history for team chat (with ultra-fast delta support via ?since=)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    let sinceDate: Date | null = null;
    if (sinceParam) {
      const parsed = new Date(sinceParam);
      if (!isNaN(parsed.getTime())) {
        sinceDate = parsed;
      }
    }

    // Parallel execution: Verify team membership and fetch messages concurrently
    const [team, messages] = await withSchemaFallback(() =>
      Promise.all([
        prisma.team.findUnique({
          where: { id: teamId },
          select: {
            ownerId: true,
            members: {
              where: { userId: user.id },
              select: { role: true },
            },
          },
        }),
        prisma.message.findMany({
          where: {
            teamId,
            ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: sinceDate ? 50 : 100,
        }),
      ]),
    );

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== user.id && team.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 },
      );
    }

    return NextResponse.json(messages, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// POST: Send new message in team chat
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    // Single fast query to verify team and membership
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        ownerId: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.ownerId !== user.id && team.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { content, fileUrl, fileName } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 },
      );
    }

    // Create message in database with schema fallback
    const message = await withSchemaFallback(() =>
      prisma.message.create({
        data: {
          content: content.trim(),
          teamId,
          senderId: user.id,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    );

    // Real-time broadcast to all online team members (non-blocking)
    broadcastToTeam(teamId, 'message:created', message).catch(() => {});

    return NextResponse.json(message, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

