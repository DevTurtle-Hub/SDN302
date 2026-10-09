import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@prisma/client';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// GET /api/tasks - Retrieve tasks accessible by current user
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    // Return tasks that either belong to user's teams or are assigned to user or created by user (single query)
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { team: { members: { some: { userId: user.id } } } },
          { assigneeId: user.id },
          { creatorId: user.id },
        ],
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
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
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks from database' },
      { status: 500 },
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to create tasks.' },
        { status: 401 },
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

    const { title, description, status, priority, dueDate, teamId, assigneeId } =
      body;

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

    // If teamId is specified, ensure user belongs to this team
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden. You are not a member of the selected team.' },
          { status: 403 },
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
        teamId: teamId || null,
        creatorId: user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
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
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 },
    );
  }
}
