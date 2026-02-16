import { PrismaClient } from '@prisma/client';

describe('Prisma integration', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reach the database', async () => {
    const rows = await prisma.$queryRaw<
      Array<{ value: number }>
    >`SELECT 1 as value`;
    expect(rows[0]?.value).toBe(1);
  });
});
