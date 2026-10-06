import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST /api/teams/[id]/members - Add a member to a team by email (Owner only)
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

    // Only owner can add members
    if (team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. Only the team Owner can add members.' },
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

    const { email } = body;

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

    const newMember = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: userToAdd.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error adding member to team:', error);
    return NextResponse.json(
      { error: 'Failed to add member to team' },
      { status: 500 },
    );
  }
}
