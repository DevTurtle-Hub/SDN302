import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// GET /api/tasks - Retrieve all tasks ordered newest first
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
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
        assigneeId: assigneeId || null,
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
