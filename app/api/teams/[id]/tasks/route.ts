import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@prisma/client';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// GET /api/teams/[id]/tasks - List tasks for a team
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

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${teamId}' not found` },
        { status: 404 },
      );
    }

    // Verify user is a member of the team
    const isMember = team.members.some((m) => m.userId === user.id);
    if (!isMember && team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this team.' },
        { status: 403 },
      );
    }

    const tasks = await prisma.task.findMany({
      where: { teamId },
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
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks for team' },
      { status: 500 },
    );
  }
}

// POST /api/teams/[id]/tasks - Create a new task within a team
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

    const { id: teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team with id '${teamId}' not found` },
        { status: 404 },
      );
    }

    // Any member of the team can create tasks
    const isMember = team.members.some((m) => m.userId === user.id);
    if (!isMember && team.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You must be a member of this team to create tasks.' },
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

    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Task title is required and cannot be empty' },
        { status: 400 },
      );
    }

    if (status && !validStatuses.includes(status as TaskStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (priority && !validPriorities.includes(priority as TaskPriority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // If assigneeId is specified, ensure they are a member of the team
    if (assigneeId) {
      const isAssigneeMember = team.members.some((m) => m.userId === assigneeId);
      if (!isAssigneeMember && team.ownerId !== assigneeId) {
        return NextResponse.json(
          { error: 'Assignee must be an active member of this team' },
          { status: 400 },
        );
      }
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dueDate format. Must be a valid date' },
          { status: 400 },
        );
      }
      parsedDueDate = d;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? String(description).trim() : null,
        status: (status as TaskStatus) || TaskStatus.TODO,
        priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
        dueDate: parsedDueDate,
        teamId: team.id,
        creatorId: user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating team task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 },
    );
  }
}
