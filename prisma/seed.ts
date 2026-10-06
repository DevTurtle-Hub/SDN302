import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Assignment 2...');

  const hashedPassword = await bcrypt.hash('Password123@', 10);

  // 1. Create or update Test User (Owner)
  const testUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      name: 'Grader Test User',
      password: hashedPassword,
    },
    create: {
      name: 'Grader Test User',
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  // 2. Create or update Member User
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {
      name: 'Nguyen Van B',
      password: hashedPassword,
    },
    create: {
      name: 'Nguyen Van B',
      email: 'member@example.com',
      password: hashedPassword,
    },
  });

  console.log('Created users:', testUser.email, memberUser.email);

  // 3. Create Sample Team
  let team = await prisma.team.findFirst({
    where: { name: 'AI & Cloud Development', ownerId: testUser.id },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'AI & Cloud Development',
        description: 'Core engineering team developing modern collaborative workspace features.',
        ownerId: testUser.id,
      },
    });
  }

  // 4. Ensure Team Memberships
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

  // 5. Create Sample Tasks
  const existingTasks = await prisma.task.count({
    where: { teamId: team.id },
  });

  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Implement User Authentication & JWT',
          description: 'Set up password hashing with bcrypt, JWT token issuing, and route protection.',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: testUser.id,
          assigneeId: testUser.id,
        },
        {
          title: 'Design Kanban Board UI',
          description: 'Develop responsive Kanban view with status columns and quick task manipulation.',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: testUser.id,
          assigneeId: memberUser.id,
        },
        {
          title: 'Prepare Assignment 2 Final Report Document',
          description: 'Complete QE123456_Ass2.docx document with checklist and test account credentials.',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          teamId: team.id,
          creatorId: memberUser.id,
          assigneeId: testUser.id,
        },
      ],
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
