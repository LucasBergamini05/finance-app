import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  return NextResponse.json(transaction);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { type, description, amount, date, category, notes } = body;

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  if (type && !["INCOME", "EXPENSE"].includes(type)) {
    return NextResponse.json(
      { error: "type deve ser INCOME ou EXPENSE" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(description && { description }),
      ...(amount !== undefined && { amount }),
      ...(date && { date: new Date(date) }),
      ...(category !== undefined && { category }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
