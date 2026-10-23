import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { broadcastToTeam, recordActivity, sendNotification } from '@/lib/realtime';

const validStatuses = Object.values(TaskStatus);
const validPriorities = Object.values(TaskPriority);

// PUT /api/tasks/[id] - Update an existing task
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

    // Role-based Authorization:
    // Owner & Admin can manage all tasks in the team.
    // Members can only manage their own tasks (creator or assignee).
    if (existingTask.team) {
      const isOwner = existingTask.team.ownerId === user.id;
      const membership = existingTask.team.members.find((m) => m.userId === user.id);
      const isAdmin = membership?.role === 'ADMIN';
      const isCreator = existingTask.creatorId === user.id;
      const isAssignee = existingTask.assigneeId === user.id;

      if (!isOwner && !isAdmin && !isCreator && !isAssignee) {
        return NextResponse.json(
          {
            error:
              'Forbidden. You can only update tasks you created or are assigned to, unless you are an Owner or Admin.',
          },
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

    // 1. Real-time Live Task Board Broadcast
    if (existingTask.teamId) {
      await broadcastToTeam(existingTask.teamId, 'task:updated', updatedTask);

      // 2. Activity Log
      const statusChanged = status && status !== existingTask.status;
      const activityDetail = statusChanged
        ? `Changed status of "${updatedTask.title}" from ${existingTask.status} to ${status}`
        : `Updated task "${updatedTask.title}"`;

      recordActivity(
        existingTask.teamId,
        user.id,
        'UPDATED_TASK',
        activityDetail,
      ).catch(() => {});

      // 3. Notification if newly assigned
      if (
        assigneeId &&
        assigneeId !== existingTask.assigneeId &&
        assigneeId !== user.id
      ) {
        sendNotification(
          assigneeId,
          'Task Assigned',
          `${user.name} assigned you to task "${updatedTask.title}" in team "${existingTask.team?.name}".`,
          'TASK_ASSIGNED',
          `/teams/${existingTask.teamId}`,
        ).catch(() => {});
      }
    }

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

    // Role-based Authorization:
    // Owner & Admin can delete any task.
    // Members can only delete tasks they created or are assigned to.
    const isTeamOwner = existingTask.team?.ownerId === user.id;
    const membership = existingTask.team?.members.find((m) => m.userId === user.id);
    const isAdmin = membership?.role === 'ADMIN';
    const isCreator = existingTask.creatorId === user.id;
    const isAssignee = existingTask.assigneeId === user.id;

    if (!isTeamOwner && !isAdmin && !isCreator && !isAssignee) {
      return NextResponse.json(
        {
          error:
            'Forbidden. Only the task creator, assignee, or team Owner/Admin can delete this task.',
        },
        { status: 403 },
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    // 1. Broadcast task deletion to all connected team members
    if (existingTask.teamId) {
      await broadcastToTeam(existingTask.teamId, 'task:deleted', {
        id,
        teamId: existingTask.teamId,
      });

      // 2. Record activity log
      recordActivity(
        existingTask.teamId,
        user.id,
        'DELETED_TASK',
        `Deleted task "${existingTask.title}"`,
      ).catch(() => {});
    }

    return NextResponse.json(
      { message: 'Task deleted successfully', id },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete task',
      },
      { status: 500 },
    );
  }
}
