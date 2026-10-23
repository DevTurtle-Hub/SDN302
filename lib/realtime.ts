import { EventEmitter } from 'events';
import Pusher from 'pusher';
import { prisma } from './prisma';

// Global EventEmitter for server-sent events across instances
const globalForEvents = globalThis as unknown as {
  realtimeEmitter: EventEmitter | undefined;
  pusherServer: Pusher | undefined;
};

export const eventEmitter =
  globalForEvents.realtimeEmitter ?? new EventEmitter();
eventEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.realtimeEmitter = eventEmitter;
}

// Optional Pusher Server initialization if credentials exist
let pusherInstance: Pusher | null = null;
if (
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET
) {
  try {
    pusherInstance =
      globalForEvents.pusherServer ??
      new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        useTLS: true,
      });
    if (process.env.NODE_ENV !== 'production') {
      globalForEvents.pusherServer = pusherInstance;
    }
  } catch (err) {
    console.error('Failed to initialize Pusher server:', err);
  }
}

/**
 * Broadcast event to all members in a team
 */
export async function broadcastToTeam(teamId: string, event: string, data: unknown) {
  // 1. Emit via internal SSE event emitter
  eventEmitter.emit(`team:${teamId}`, { event, data });

  // 2. Also emit to Pusher if configured
  if (pusherInstance) {
    try {
      await pusherInstance.trigger(`team-${teamId}`, event, data);
    } catch (err) {
      console.warn('Pusher broadcastToTeam error:', err);
    }
  }
}

/**
 * Broadcast event to a specific user (e.g. notifications)
 */
export async function broadcastToUser(userId: string, event: string, data: unknown) {
  // 1. Emit via internal SSE event emitter
  eventEmitter.emit(`user:${userId}`, { event, data });

  // 2. Also emit to Pusher if configured
  if (pusherInstance) {
    try {
      await pusherInstance.trigger(`user-${userId}`, event, data);
    } catch (err) {
      console.warn('Pusher broadcastToUser error:', err);
    }
  }
}

/**
 * Log activity in a team and broadcast real-time event
 */
export async function recordActivity(
  teamId: string,
  userId: string,
  action: string,
  details: string,
) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        teamId,
        userId,
        action,
        details,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await broadcastToTeam(teamId, 'activity:created', activity);
    return activity;
  } catch (err) {
    console.error('Error logging activity:', err);
    return null;
  }
}

/**
 * Create a notification for a user and trigger live update
 */
export async function sendNotification(
  userId: string,
  title: string,
  content: string,
  type: 'TASK_ASSIGNED' | 'TEAM_INVITE' | 'ROLE_UPDATED' | 'TASK_STATUS' | 'GENERAL',
  link?: string,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        link: link || null,
      },
    });

    await broadcastToUser(userId, 'notification:created', notification);
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}
