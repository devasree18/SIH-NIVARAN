import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
});

// Enable SQLite WAL mode for higher concurrency and performance
prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
  .then(() => {
    // WAL mode active
  })
  .catch((err) => {
    console.warn('Could not set WAL mode:', err);
  });
