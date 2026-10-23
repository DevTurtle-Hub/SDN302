import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { eventEmitter } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial connection message
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId: user.id, timestamp: Date.now() })}\n\n`),
      );

      // 2. User-specific event listener (e.g. notifications)
      const userChannel = `user:${user.id}`;
      const userListener = (payload: { event: string; data: unknown }) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`),
          );
        } catch {
          // Stream might be closed
        }
      };
      eventEmitter.on(userChannel, userListener);

      // 3. Team-specific event listener (tasks, chat, activities, typing)
      let teamListener: ((payload: { event: string; data: unknown }) => void) | null = null;
      let teamChannel: string | null = null;
      if (teamId) {
        teamChannel = `team:${teamId}`;
        teamListener = (payload: { event: string; data: unknown }) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`),
            );
          } catch {
            // Stream might be closed
          }
        };
        eventEmitter.on(teamChannel, teamListener);
      }

      // 4. Keep-alive heartbeat interval every 15 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 5. Cleanup on abort
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        eventEmitter.off(userChannel, userListener);
        if (teamChannel && teamListener) {
          eventEmitter.off(teamChannel, teamListener);
        }
      };

      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel proxies
    },
  });
}
