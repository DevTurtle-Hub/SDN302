import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastToTeam, recordActivity, sendNotification } from '@/lib/realtime';

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

// PUT /api/teams/[id]/members/[userId] - Update member role (Owner & Admin only)
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id: teamId, userId: targetUserId } = await context.params;
    const body = await request.json();
    const { role } = body;

    const validRoles = ['ADMIN', 'MEMBER'];
    if (!role || !validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN or MEMBER.' },
        { status: 400 },
      );
    }
    const targetRole = role.toUpperCase();

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team not found` },
        { status: 404 },
      );
    }

    // Determine requester role
    const isOwner = team.ownerId === user.id;
    const requesterMembership = team.members.find((m) => m.userId === user.id);
    const isAdmin = requesterMembership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only the Team Owner or Admins can change member roles.' },
        { status: 403 },
      );
    }

    // Cannot modify the Owner's role
    if (targetUserId === team.ownerId) {
      return NextResponse.json(
        { error: 'Cannot modify the Owner role.' },
        { status: 400 },
      );
    }

    const targetMembership = team.members.find((m) => m.userId === targetUserId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 },
      );
    }

    // Admin cannot change another Admin's role (only Owner can)
    if (isAdmin && !isOwner && targetMembership.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only the Team Owner can change an Admin role.' },
        { status: 403 },
      );
    }

    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: {
        role: targetRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast real-time update
    await broadcastToTeam(teamId, 'member:updated', updatedMember);

    // Record activity log
    recordActivity(
      teamId,
      user.id,
      'CHANGED_ROLE',
      `Changed ${updatedMember.user.name}'s role to ${targetRole}`,
    ).catch(() => {});

    // Send in-app notification to the affected user
    sendNotification(
      targetUserId,
      'Team Role Updated',
      `Your role in team "${team.name}" has been updated to ${targetRole}.`,
      'ROLE_UPDATED',
      `/teams/${teamId}`,
    ).catch(() => {});

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 },
    );
  }
}

// DELETE /api/teams/[id]/members/[userId] - Remove a member from a team (Owner or Admin)
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id: teamId, userId: targetUserId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${teamId}' not found` },
        { status: 404 },
      );
    }

    const isOwner = team.ownerId === user.id;
    const requesterMembership = team.members.find((m) => m.userId === user.id);
    const isAdmin = requesterMembership?.role === 'ADMIN';

    // Must be owner or admin
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only Team Owner or Admins can remove members.' },
        { status: 403 },
      );
    }

    // Owner cannot be removed
    if (targetUserId === team.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove the Owner from the team.' },
        { status: 400 },
      );
    }

    // Admin cannot remove another Admin or Owner
    const targetMembership = team.members.find((m) => m.userId === targetUserId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 },
      );
    }

    if (isAdmin && !isOwner && targetMembership.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Admins cannot remove other Admins.' },
        { status: 403 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true },
    });

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    // Broadcast member removal to team
    await broadcastToTeam(teamId, 'member:removed', {
      userId: targetUserId,
      teamId,
    });

    // Record activity
    recordActivity(
      teamId,
      user.id,
      'REMOVED_MEMBER',
      `Removed ${targetUser?.name || 'a member'} from the team`,
    ).catch(() => {});

    // Notify user
    sendNotification(
      targetUserId,
      'Removed from Team',
      `You have been removed from team "${team.name}".`,
      'GENERAL',
    ).catch(() => {});

    return NextResponse.json(
      { message: 'Member removed from team successfully', userId: targetUserId },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from team' },
      { status: 500 },
    );
  }
}
