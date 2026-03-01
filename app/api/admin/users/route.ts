import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/users?q=&page=1&limit=20&sort=createdAt&order=desc
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = (page - 1) * limit;
  const sort = (searchParams.get("sort") ?? "createdAt") as "createdAt" | "updatedAt" | "email";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAdmin: true,
        isSuspended: true,
        createdAt: true,
        credit: { select: { balance: true } },
        subscriptions: {
          where: { status: "active" },
          select: { plan: { select: { displayName: true } } },
          take: 1,
        },
        _count: { select: { chatSessions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
