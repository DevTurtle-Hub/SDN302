import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// DELETE /api/teams/[id]/members/[userId] - Remove a member from a team (Owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    const { id: teamId, userId: targetUserId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${teamId}' not found` },
        { status: 404 },
      );
    }

    // Only owner can remove members
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can remove members.' },
        { status: 403 },
      );
    }

    // Owner cannot remove themselves from team
    if (targetUserId === team.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove the Owner from the team.' },
        { status: 400 },
      );
    }

    // Check if membership exists
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 },
      );
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

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
