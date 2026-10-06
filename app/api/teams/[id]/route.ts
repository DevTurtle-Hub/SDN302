import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET /api/teams/[id] - Get team details, including members and tasks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${id}' not found` },
        { status: 404 },
      );
    }

    // Verify current user is a member or owner of this team
    const isMember = team.members.some((m) => m.userId === user.id);
    if (!isMember && team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team details' },
      { status: 500 },
    );
  }
}

// PUT /api/teams/[id] - Update team info (Owner only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${id}' not found` },
        { status: 404 },
      );
    }

    // Only owner can update team details
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can update team details.' },
        { status: 403 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 },
      );
    }

    const { name, description } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Team name cannot be empty' },
        { status: 400 },
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined
          ? { description: description ? String(description).trim() : null }
          : {}),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedTeam, { status: 200 });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/[id] - Delete a team (Owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${id}' not found` },
        { status: 404 },
      );
    }

    // Only owner can delete team
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can delete this team.' },
        { status: 403 },
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Team deleted successfully', id },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 },
    );
  }
}
