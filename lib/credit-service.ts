import { prisma, type PrismaTransactionClient } from "@/lib/db/prisma";

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export const CREDIT_COSTS = {
  SAJU_ANALYSIS: 2,
  CHAT_MESSAGE: 1,
  COMPATIBILITY: 3,
} as const;

export const INITIAL_FREE_CREDITS = 10;

export async function getBalance(userId: string): Promise<number> {
  const credit = await prisma.credit.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return credit?.balance ?? 0;
}

export async function consumeCredit(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; balance: number; transactionId?: string }> {
  if (amount <= 0) throw new Error("차감 금액은 0보다 커야 합니다");

  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const credit = await tx.credit.findUnique({
      where: { userId },
      select: { balance: true },
    });

    const currentBalance = credit?.balance ?? 0;
    if (currentBalance < amount) {
      return { success: false, balance: currentBalance };
    }

    const [updated, log] = await Promise.all([
      tx.credit.upsert({
        where: { userId },
        update: { balance: { decrement: amount } },
        create: { userId, balance: -amount },
      }),
      tx.creditLog.create({ data: { userId, amount: -amount, reason } }),
    ]);

    return { success: true, balance: updated.balance, transactionId: log.id };
  });
}

export async function addCredit(
  userId: string,
  amount: number,
  reason: string,
  adminId?: string
): Promise<{ balance: number; transactionId: string }> {
  if (amount <= 0) throw new Error("추가 금액은 0보다 커야 합니다");

  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const [updated, log] = await Promise.all([
      tx.credit.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      }),
      tx.creditLog.create({ data: { userId, amount, reason, adminId } }),
    ]);

    return { balance: updated.balance, transactionId: log.id };
  });
}

export async function getCreditHistory(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ logs: CreditTransaction[]; total: number }> {
  const { limit = 20, offset = 0 } = options;

  const [logs, total] = await Promise.all([
    prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
    prisma.creditLog.count({ where: { userId } }),
  ]);

  return { logs, total };
}

export function isCreditEnabled(): boolean {
  return process.env.ENABLE_CREDIT_SYSTEM === "true";
}
