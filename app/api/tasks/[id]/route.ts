import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@prisma/client';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// PUT /api/tasks/[id] - Update an existing task (team members only)
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

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: `Task with id '${id}' not found` },
        { status: 404 },
      );
    }

    // If task belongs to a team, verify current user is a team member or owner
    if (existingTask.team) {
      const isMember = existingTask.team.members.some((m) => m.userId === user.id);
      const isOwner = existingTask.team.ownerId === user.id;
      if (!isMember && !isOwner) {
        return NextResponse.json(
          { error: 'Forbidden. You must be a member of this team to update this task.' },
          { status: 403 },
        );
      }
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

    // If updating assigneeId and task is in a team, ensure assignee is a team member
    if (assigneeId !== undefined && assigneeId !== null && existingTask.team) {
      const isAssigneeMember = existingTask.team.members.some(
        (m) => m.userId === assigneeId,
      );
      const isAssigneeOwner = existingTask.team.ownerId === assigneeId;
      if (!isAssigneeMember && !isAssigneeOwner) {
        return NextResponse.json(
          { error: 'Assignee must be an active member of the team' },
          { status: 400 },
        );
      }
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
        ...(assigneeId !== undefined ? { assigneeId: assigneeId || null } : {}),
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
// Only the task creator, the assignee, or the team Owner can delete a task!
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

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: `Task with id '${id}' not found` },
        { status: 404 },
      );
    }

    // Role-based Authorization:
    // Only the task creator, the assignee, or the team Owner can delete a task.
    const isCreator = existingTask.creatorId === user.id;
    const isAssignee = existingTask.assigneeId === user.id;
    const isTeamOwner = existingTask.team?.ownerId === user.id;

    if (!isCreator && !isAssignee && !isTeamOwner) {
      return NextResponse.json(
        {
          error:
            'Forbidden. Only the task creator, the assignee, or the team Owner can delete this task.',
        },
        { status: 403 },
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
