'use client';

import Pusher from 'pusher-js';

let globalPusher: Pusher | null = null;

function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') return null;

  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!pusherKey) return null;

  if (!globalPusher) {
    globalPusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    });
  }

  return globalPusher;
}

export type RealtimeEventHandler = (data: any) => void;

/**
 * Subscribe to team events (tasks, messages, activities, members, typing)
 * Automatically uses Pusher if NEXT_PUBLIC_PUSHER_KEY is provided, or SSE as reliable fallback.
 */
export function subscribeToTeamChannel(
  teamId: string,
  eventHandlers: { [event: string]: RealtimeEventHandler },
  onConnected?: () => void,
): () => void {
  const pusher = getPusherClient();

  if (pusher) {
    const channelName = `team-${teamId}`;
    const channel = pusher.subscribe(channelName);

    if (onConnected) {
      channel.bind('pusher:subscription_succeeded', onConnected);
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.bind(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        channel.unbind(event, handler);
      });
      pusher.unsubscribe(channelName);
    };
  }

  // Fallback: Native Server-Sent Events (SSE)
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource(`/api/realtime?teamId=${teamId}`);

    if (onConnected) {
      eventSource.addEventListener('connected', onConnected);
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      eventSource?.addEventListener(event, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          handler(parsed);
        } catch (err) {
          console.error(`Error parsing event ${event}:`, err);
        }
      });
    });
  } catch (err) {
    console.warn('Realtime SSE fallback connection error:', err);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * Subscribe to user-specific events (e.g. notifications)
 */
export function subscribeToUserChannel(
  userId: string,
  eventHandlers: { [event: string]: RealtimeEventHandler },
  onConnected?: () => void,
): () => void {
  const pusher = getPusherClient();

  if (pusher) {
    const channelName = `user-${userId}`;
    const channel = pusher.subscribe(channelName);

    if (onConnected) {
      channel.bind('pusher:subscription_succeeded', onConnected);
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.bind(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        channel.unbind(event, handler);
      });
      pusher.unsubscribe(channelName);
    };
  }

  // Fallback: Native SSE
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource(`/api/realtime`);

    if (onConnected) {
      eventSource.addEventListener('connected', onConnected);
    }

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      eventSource?.addEventListener(event, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          handler(parsed);
        } catch (err) {
          console.error(`Error parsing user event ${event}:`, err);
        }
      });
    });
  } catch (err) {
    console.warn('Realtime SSE user channel error:', err);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}
