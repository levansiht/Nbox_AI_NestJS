import { randomInt } from 'crypto';
import { Prisma } from 'generated/prisma/client';

export function isUniqueConstrainPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export const generateOTP = () => {
  return String(randomInt(100000, 1000000));
};
