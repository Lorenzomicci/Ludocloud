import * as argon2 from 'argon2';
import {
  PrismaClient,
  BookingStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Password123!');

  await prisma.user.upsert({
    where: { email: 'admin@ludocloud.local' },
    update: {},
    create: {
      email: 'admin@ludocloud.local',
      passwordHash,
      fullName: 'Admin Ludocloud',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '+390000000001',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@ludocloud.local' },
    update: {},
    create: {
      email: 'staff@ludocloud.local',
      passwordHash,
      fullName: 'Staff Ludocloud',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      phone: '+390000000002',
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@ludocloud.local' },
    update: {},
    create: {
      email: 'member@ludocloud.local',
      passwordHash,
      fullName: 'Membro Demo',
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      phone: '+390000000003',
    },
  });

  const member = await prisma.member.upsert({
    where: { userId: memberUser.id },
    update: {},
    create: {
      userId: memberUser.id,
      membershipCode: 'MEM-0001',
      notes: 'Iscritto seed per demo esame',
    },
  });

  const tableData = [
    { code: 'T1', capacity: 4, zone: 'Sala A' },
    { code: 'T2', capacity: 6, zone: 'Sala A' },
    { code: 'T3', capacity: 8, zone: 'Sala B' },
  ];

  for (const table of tableData) {
    await prisma.tableEntity.upsert({
      where: { code: table.code },
      update: table,
      create: table,
    });
  }

  const games = [
    {
      title: 'Catan',
      category: 'Strategia',
      minPlayers: 3,
      maxPlayers: 4,
      minAge: 10,
      durationMin: 90,
      stockTotal: 4,
      stockAvailable: 4,
    },
    {
      title: 'Ticket to Ride',
      category: 'Family',
      minPlayers: 2,
      maxPlayers: 5,
      minAge: 8,
      durationMin: 60,
      stockTotal: 3,
      stockAvailable: 3,
    },
    {
      title: 'Dixit',
      category: 'Party',
      minPlayers: 3,
      maxPlayers: 6,
      minAge: 8,
      durationMin: 30,
      stockTotal: 5,
      stockAvailable: 5,
    },
  ];

  for (const game of games) {
    await prisma.boardGame.upsert({
      where: { title: game.title },
      update: game,
      create: game,
    });
  }

  const demoTable = await prisma.tableEntity.findFirstOrThrow({
    where: { code: 'T1' },
  });

  const existingFutureBookings = await prisma.booking.count({
    where: {
      memberId: member.id,
      startAt: { gt: new Date() },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    },
  });

  if (existingFutureBookings === 0) {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    await prisma.booking.create({
      data: {
        memberId: member.id,
        tableId: demoTable.id,
        startAt: start,
        endAt: end,
        peopleCount: 4,
        status: BookingStatus.CONFIRMED,
        notes: 'Prenotazione demo seed',
        createdBy: staff.id,
      },
    });
  }

  console.log('Seed completato.');
  console.log(
    'Utenti demo: admin@ludocloud.local, staff@ludocloud.local, member@ludocloud.local',
  );
  console.log('Password demo comune: Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
