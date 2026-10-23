import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

let schemaEnsured = false;
let ensuringPromise: Promise<void> | null = null;

/**
 * Automatically ensures Assignment 3 & 4 tables (Message, Notification, ActivityLog)
 * exist in the database even if prisma db push was not executed in production yet.
 */
export async function ensureDatabaseSchema() {
  if (schemaEnsured) return;
  if (ensuringPromise) return ensuringPromise;

  ensuringPromise = (async () => {
    try {
      // 1. Create Message table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "teamId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "fileUrl" TEXT,
          "fileName" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Message_teamId_createdAt_idx" ON "Message"("teamId", "createdAt");
      `);

      // 2. Create Notification table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "link" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
      `);

      // 3. Create ActivityLog table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ActivityLog" (
          "id" TEXT NOT NULL,
          "teamId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "details" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "ActivityLog_teamId_createdAt_idx" ON "ActivityLog"("teamId", "createdAt");
      `);

      // 4. Safely attach Foreign Key constraints if not present
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_teamId_fkey') THEN
            ALTER TABLE "Message" ADD CONSTRAINT "Message_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_senderId_fkey') THEN
            ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
            ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_teamId_fkey') THEN
            ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_userId_fkey') THEN
            ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      schemaEnsured = true;
    } catch (err) {
      console.error('Failed to auto-ensure database schema:', err);
    } finally {
      ensuringPromise = null;
    }
  })();

  return ensuringPromise;
}

/**
 * Executes a database operation and only runs ensureDatabaseSchema()
 * as an automatic fallback if a "table does not exist" error occurs.
 * This completely avoids DDL catalog locking on hot paths.
 */
export async function withSchemaFallback<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const errorAny = err as { code?: string; message?: string };
    if (
      errorAny?.code === 'P2021' ||
      (typeof errorAny?.message === 'string' &&
        (errorAny.message.includes('does not exist') ||
          errorAny.message.includes('relation') ||
          errorAny.message.includes('table')))
    ) {
      console.warn('Auto-ensuring missing database tables...');
      await ensureDatabaseSchema();
      return await fn();
    }
    throw err;
  }
}
