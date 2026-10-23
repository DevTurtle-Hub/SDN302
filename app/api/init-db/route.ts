import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseSchema } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Ensure all tables (Message, Notification, ActivityLog) exist
    await ensureDatabaseSchema();

    const hashedPassword = await bcrypt.hash('Password123@', 10);

    // 2. Upsert primary test user (Owner)
    const testUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Nguyen Van Quy (Owner)',
        email: 'demo@example.com',
        password: hashedPassword,
      },
    });

    // 3. Upsert admin test user (Admin)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Tran Thi Admin',
        email: 'admin@example.com',
        password: hashedPassword,
      },
    });

    // 4. Upsert member test user (Member)
    const memberUser = await prisma.user.upsert({
      where: { email: 'member@example.com' },
      update: { password: hashedPassword },
      create: {
        name: 'Nguyen Van B (Member)',
        email: 'member@example.com',
        password: hashedPassword,
      },
    });

    // 5. Ensure core team
    let team = await prisma.team.findFirst({
      where: { name: 'AI & Cloud Development' },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: 'AI & Cloud Development',
          description: 'Core engineering team developing real-time collaboration workspace features.',
          ownerId: testUser.id,
        },
      });
    }

    // 6. Ensure team memberships with 3 roles
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: testUser.id } },
      update: { role: 'OWNER' },
      create: { teamId: team.id, userId: testUser.id, role: 'OWNER' },
    });

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: adminUser.id } },
      update: { role: 'ADMIN' },
      create: { teamId: team.id, userId: adminUser.id, role: 'ADMIN' },
    });

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: memberUser.id } },
      update: { role: 'MEMBER' },
      create: { teamId: team.id, userId: memberUser.id, role: 'MEMBER' },
    });

    return NextResponse.json({
      success: true,
      message: 'Database schema ensured and test accounts ready!',
      tables: ['Message', 'Notification', 'ActivityLog', 'User', 'Team', 'TeamMember', 'Task'],
      testAccounts: [
        { email: 'demo@example.com', role: 'OWNER', password: 'Password123@' },
        { email: 'admin@example.com', role: 'ADMIN', password: 'Password123@' },
        { email: 'member@example.com', role: 'MEMBER', password: 'Password123@' },
      ],
      team: { id: team.id, name: team.name },
    });
  } catch (error: unknown) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize database',
      },
      { status: 500 },
    );
  }
}
