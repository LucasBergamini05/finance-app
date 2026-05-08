import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as TransactionType | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type && { type }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, description, amount, date, category, notes } = body;

  if (!type || !description || amount === undefined || !date) {
    return NextResponse.json(
      { error: "Campos obrigatórios: type, description, amount, date" },
      { status: 400 }
    );
  }

  if (!["INCOME", "EXPENSE"].includes(type)) {
    return NextResponse.json(
      { error: "type deve ser INCOME ou EXPENSE" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      type,
      description,
      amount,
      date: new Date(date),
      category: category ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
