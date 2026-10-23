import { NextRequest, NextResponse } from 'next/server';
import { prisma, withSchemaFallback } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await context.params;

    // Concurrently verify team membership and fetch activities
    const [team, activities] = await withSchemaFallback(() =>
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
        prisma.activityLog.findMany({
          where: { teamId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
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

    return NextResponse.json(activities, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}

