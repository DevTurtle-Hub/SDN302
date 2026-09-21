import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// PUT /api/tasks/[id] - Update an existing task
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: `Task with id '${id}' not found` },
        { status: 404 },
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

    const { title, description, status, priority, dueDate } = body;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json(
        { error: 'Task title cannot be empty' },
        { status: 400 },
      );
    }

    if (status !== undefined && !validStatuses.includes(status as TaskStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (priority !== undefined && !validPriorities.includes(priority as TaskPriority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        },
        { status: 400 },
      );
    }

    let parsedDueDate: Date | null | undefined = undefined;
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        parsedDueDate = null;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { error: 'Invalid dueDate format' },
            { status: 400 },
          );
        }
        parsedDueDate = d;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description ? String(description).trim() : null }
          : {}),
        ...(status !== undefined ? { status: status as TaskStatus } : {}),
        ...(priority !== undefined ? { priority: priority as TaskPriority } : {}),
        ...(parsedDueDate !== undefined ? { dueDate: parsedDueDate } : {}),
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 },
    );
  }
}

// DELETE /api/tasks/[id] - Delete an existing task
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: `Task with id '${id}' not found` },
        { status: 404 },
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Task deleted successfully', id },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 },
    );
  }
}
