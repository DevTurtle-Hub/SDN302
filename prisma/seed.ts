import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Assignment 3 & 4...');

  const hashedPassword = await bcrypt.hash('Password123@', 10);

  // 1. Create or update Primary Test User (Owner)
  const testUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      name: 'Nguyen Van Quy (Owner)',
      password: hashedPassword,
    },
    create: {
      name: 'Nguyen Van Quy (Owner)',
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  // 2. Create or update Colleague User (Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Tran Thi Admin',
      password: hashedPassword,
    },
    create: {
      name: 'Tran Thi Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    },
  });

  // 3. Create or update Member User
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {
      name: 'Nguyen Van B (Member)',
      password: hashedPassword,
    },
    create: {
      name: 'Nguyen Van B (Member)',
      email: 'member@example.com',
      password: hashedPassword,
    },
  });

  console.log('Created users:', testUser.email, adminUser.email, memberUser.email);

  // 4. Create Core Engineering Team
  let team = await prisma.team.findFirst({
    where: { name: 'AI & Cloud Development', ownerId: testUser.id },
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

  // 5. Ensure Memberships with 3 distinct roles: OWNER, ADMIN, MEMBER
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: testUser.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      teamId: team.id,
      userId: testUser.id,
      role: 'OWNER',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: adminUser.id,
      },
    },
    update: { role: 'ADMIN' },
    create: {
      teamId: team.id,
      userId: adminUser.id,
      role: 'ADMIN',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: memberUser.id,
      },
    },
    update: { role: 'MEMBER' },
    create: {
      teamId: team.id,
      userId: memberUser.id,
      role: 'MEMBER',
    },
  });

  // 6. Create Tasks
  const existingTasks = await prisma.task.count({
    where: { teamId: team.id },
  });

  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Implement Supabase/Pusher Real-time WebSocket',
          description: 'Enable live updates across connected clients for chat and task board.',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: testUser.id,
          assigneeId: testUser.id,
        },
        {
          title: 'Develop Real-time Team Chat Room',
          description: 'Persist messages with sender, timestamp, typing indicators and live auto-scroll.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: testUser.id,
          assigneeId: memberUser.id,
        },
        {
          title: 'Enforce RBAC (Owner, Admin, Member)',
          description: 'Validate API endpoints and hide restricted UI actions based on role.',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: adminUser.id,
          assigneeId: adminUser.id,
        },
      ],
    });
  }

  // 7. Seed Sample Chat Messages
  const existingMessages = await prisma.message.count({
    where: { teamId: team.id },
  });

  if (existingMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          teamId: team.id,
          senderId: testUser.id,
          content: 'Chào mừng các bạn đến với nhóm AI & Cloud Development! Hệ thống realtime chat đã hoạt động.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          teamId: team.id,
          senderId: adminUser.id,
          content: 'Tuyệt vời! Tôi đã xem qua task board, các đầu việc đã được phân bổ cho sprint tuần này.',
          createdAt: new Date(Date.now() - 20 * 60 * 1000),
        },
        {
          teamId: team.id,
          senderId: memberUser.id,
          content: 'Tôi đang tiến hành làm task Real-time Team Chat. Sẽ cập nhật tiến độ lên Kanban ngay.',
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      ],
    });
  }

  // 8. Seed Sample Notifications
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [testUser.id, adminUser.id, memberUser.id] },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: memberUser.id,
        title: 'Task Assigned',
        content: `${testUser.name} assigned you to task "Develop Real-time Team Chat Room".`,
        type: 'TASK_ASSIGNED',
        link: `/teams/${team.id}`,
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        title: 'Team Role Updated',
        content: `You have been promoted to ADMIN in team "${team.name}".`,
        type: 'ROLE_UPDATED',
        link: `/teams/${team.id}`,
        read: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        userId: testUser.id,
        title: 'Welcome to TaskFlow',
        content: `Your workspace has been initialized with Real-time Collaboration & RBAC.`,
        type: 'GENERAL',
        link: `/teams/${team.id}`,
        read: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ],
  });

  // 9. Seed Sample Activity Logs
  const existingActivities = await prisma.activityLog.count({
    where: { teamId: team.id },
  });

  if (existingActivities === 0) {
    await prisma.activityLog.createMany({
      data: [
        {
          teamId: team.id,
          userId: testUser.id,
          action: 'CREATED_TASK',
          details: 'Created task "Implement Supabase/Pusher Real-time WebSocket"',
          createdAt: new Date(Date.now() - 120 * 60 * 1000),
        },
        {
          teamId: team.id,
          userId: testUser.id,
          action: 'CHANGED_ROLE',
          details: `Promoted ${adminUser.name} to ADMIN`,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
        {
          teamId: team.id,
          userId: memberUser.id,
          action: 'UPDATED_TASK',
          details: 'Moved task "Develop Real-time Team Chat Room" to IN_PROGRESS',
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      ],
    });
  }

  console.log('Seeding completed successfully with Real-time Chat, RBAC, Notifications & Activity Logs!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
