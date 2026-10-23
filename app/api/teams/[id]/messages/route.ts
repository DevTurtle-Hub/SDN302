import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam, recordActivity } from '@/lib/realtime';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Fetch message history for team chat
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await ensureDatabaseSchema();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    // Check if user is member or owner of team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!membership && team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not a member of this team' },
        { status: 403 },
      );
    }

    // Fetch messages with sender info
    const messages = await prisma.message.findMany({
      where: { teamId },
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
      take: 100,
    });

    return NextResponse.json(messages);
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
    await ensureDatabaseSchema();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    // Verify membership
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true, name: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (!membership && team.ownerId !== user.id) {
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

    // Create message in database
    const message = await prisma.message.create({
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
    });

    // Real-time broadcast to all online team members
    await broadcastToTeam(teamId, 'message:created', message);

    // Record activity log for team audit trail
    recordActivity(
      teamId,
      user.id,
      'SENT_MESSAGE',
      `Sent a message in team chat`,
    ).catch(() => {});

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
