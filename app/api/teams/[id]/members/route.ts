import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam, recordActivity, sendNotification } from '@/lib/realtime';

// POST /api/teams/[id]/members - Add a member to a team by email (Owner & Admin)
export async function POST(
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
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${id}' not found` },
        { status: 404 },
      );
    }

    // Role check: Only Owner or Admin can add members
    const isOwner = team.ownerId === user.id;
    const requesterMembership = team.members.find((m) => m.userId === user.id);
    const isAdmin = requesterMembership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only the Team Owner or Admins can add members.' },
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

    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid user email is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: `User with email '${normalizedEmail}' not found. They must register first.` },
        { status: 404 },
      );
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) => m.userId === userToAdd.id);
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 },
      );
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    const newMember = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: userToAdd.id,
        role: assignedRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 1. Broadcast real-time event to active team members
    await broadcastToTeam(team.id, 'member:added', newMember);

    // 2. Record activity in team audit log
    recordActivity(
      team.id,
      user.id,
      'ADDED_MEMBER',
      `Added ${userToAdd.name} (${assignedRole}) to the team`,
    ).catch(() => {});

    // 3. Send in-app notification to the newly added user
    sendNotification(
      userToAdd.id,
      'Added to Team',
      `You have been added to team "${team.name}" by ${user.name}.`,
      'TEAM_INVITE',
      `/teams/${team.id}`,
    ).catch(() => {});

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding member to team:', error);
    return NextResponse.json(
      { error: 'Failed to add member to team' },
      { status: 500 },
    );
  }
}
