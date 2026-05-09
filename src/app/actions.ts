"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TransactionFormData } from "@/types/transaction";

// ── Category ──────────────────────────────────────────────

export async function createCategory(data: { name: string; color: string }) {
  await prisma.category.create({ data });
  revalidatePath("/");
}

export async function updateCategory(
  id: string,
  data: { name: string; color: string }
) {
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
}

// ── Card ──────────────────────────────────────────────────

export async function createCard(data: {
  name: string;
  lastFourDigits?: string;
  color: string;
  closingDayType: "FIXED" | "RELATIVE";
  closingDay: number;
}) {
  await prisma.card.create({
    data: { ...data, lastFourDigits: data.lastFourDigits || null },
  });
  revalidatePath("/");
}

export async function updateCard(
  id: string,
  data: {
    name: string;
    lastFourDigits?: string;
    color: string;
    closingDayType: "FIXED" | "RELATIVE";
    closingDay: number;
  }
) {
  await prisma.card.update({
    where: { id },
    data: { ...data, lastFourDigits: data.lastFourDigits || null },
  });
  revalidatePath("/");
}

export async function deleteCard(id: string) {
  await prisma.card.delete({ where: { id } });
  revalidatePath("/");
}

// ── Transaction ────────────────────────────────────────────

function buildTransactionData(data: TransactionFormData) {
  const installments =
    data.paymentMethod === "CREDIT_CARD" ? (data.installments ?? 1) : 1;
  return {
    type: data.type,
    description: data.description,
    amount: data.amount,
    date: new Date(data.date),
    categoryId: data.categoryId || null,
    notes: data.notes || null,
    paymentMethod: data.paymentMethod ?? null,
    cardId: data.cardId || null,
    installments,
  };
}

export async function createTransaction(data: TransactionFormData) {
  await prisma.transaction.create({
    data: {
      ...buildTransactionData(data),
      isRecurring: data.isRecurring ?? false,
    },
  });
  revalidatePath("/");
}

export async function updateTransaction(
  id: string,
  data: TransactionFormData
) {
  await prisma.transaction.update({
    where: { id },
    data: buildTransactionData(data),
  });
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/");
}

// ── Recurring transactions ─────────────────────────────────

export async function updateRecurringThisMonth(
  parentId: string,
  month: string,
  exceptionId: string | undefined,
  data: TransactionFormData
) {
  const fields = buildTransactionData(data);
  if (exceptionId) {
    await prisma.transaction.update({ where: { id: exceptionId }, data: fields });
  } else {
    await prisma.transaction.create({
      data: {
        ...fields,
        recurringParentId: parentId,
        recurringExceptionMonth: month,
      },
    });
  }
  revalidatePath("/");
}

export async function updateRecurringThisAndFollowing(
  parentId: string,
  month: string,
  data: TransactionFormData
) {
  const original = await prisma.transaction.findUniqueOrThrow({
    where: { id: parentId },
  });
  const originalDay = original.date.getUTCDate();
  const endDate = new Date(`${month}-01`);

  const [year, mon] = month.split("-").map(Number);
  const maxDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const newDay = Math.min(originalDay, maxDay);
  const newDate = new Date(
    Date.UTC(year, mon - 1, newDay)
  );

  await prisma.transaction.update({
    where: { id: parentId },
    data: { recurringEndDate: endDate },
  });
  await prisma.transaction.create({
    data: {
      ...buildTransactionData(data),
      date: newDate,
      isRecurring: true,
    },
  });
  revalidatePath("/");
}

export async function deleteRecurringThisMonth(
  parentId: string,
  month: string,
  exceptionId: string | undefined
) {
  if (exceptionId) {
    await prisma.transaction.update({
      where: { id: exceptionId },
      data: { deletedAt: new Date() },
    });
  } else {
    const parent = await prisma.transaction.findUniqueOrThrow({
      where: { id: parentId },
    });
    await prisma.transaction.create({
      data: {
        type: parent.type,
        description: parent.description,
        amount: parent.amount,
        date: new Date(`${month}-01`),
        recurringParentId: parentId,
        recurringExceptionMonth: month,
        deletedAt: new Date(),
      },
    });
  }
  revalidatePath("/");
}

export async function deleteRecurringThisAndFollowing(
  parentId: string,
  month: string
) {
  await prisma.transaction.update({
    where: { id: parentId },
    data: { recurringEndDate: new Date(`${month}-01`) },
  });
  revalidatePath("/");
}

// ── Backup (export / import) ──────────────────────────────

export type BackupData = {
  version: 1;
  exportedAt: string;
  categories: unknown[];
  cards: unknown[];
  transactions: unknown[];
};

export async function exportData(): Promise<BackupData> {
  const [categories, cards, transactions] = await Promise.all([
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.card.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return JSON.parse(
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      categories,
      cards,
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    })
  );
}

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type CardRow = {
  id: string;
  name: string;
  lastFourDigits: string | null;
  color: string;
  closingDayType: "FIXED" | "RELATIVE";
  closingDay: number;
  createdAt: string;
  updatedAt: string;
};

type TransactionRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number | string;
  date: string;
  categoryId: string | null;
  notes: string | null;
  paymentMethod:
    | "CASH"
    | "DEBIT"
    | "CREDIT_CARD"
    | "PIX"
    | "TRANSFER"
    | null;
  cardId: string | null;
  installments: number;
  deletedAt: string | null;
  isRecurring: boolean;
  recurringEndDate: string | null;
  recurringParentId: string | null;
  recurringExceptionMonth: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function importData(payload: BackupData) {
  if (!payload || payload.version !== 1) {
    throw new Error("Formato de backup inválido");
  }

  const categories = payload.categories as CategoryRow[];
  const cards = payload.cards as CardRow[];
  const transactions = payload.transactions as TransactionRow[];

  await prisma.$transaction(async (tx) => {
    // Wipe existing data (transactions first due to FK constraints)
    await tx.transaction.deleteMany({});
    await tx.category.deleteMany({});
    await tx.card.deleteMany({});

    if (categories.length > 0) {
      await tx.category.createMany({
        data: categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
      });
    }

    if (cards.length > 0) {
      await tx.card.createMany({
        data: cards.map((c) => ({
          id: c.id,
          name: c.name,
          lastFourDigits: c.lastFourDigits,
          color: c.color,
          closingDayType: c.closingDayType,
          closingDay: c.closingDay,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
      });
    }

    if (transactions.length > 0) {
      // Insert non-exception transactions first (exceptions reference parents)
      const parents = transactions.filter((t) => !t.recurringParentId);
      const exceptions = transactions.filter((t) => t.recurringParentId);

      const toRow = (t: TransactionRow) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: t.amount as never,
        date: new Date(t.date),
        categoryId: t.categoryId,
        notes: t.notes,
        paymentMethod: t.paymentMethod,
        cardId: t.cardId,
        installments: t.installments,
        deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
        isRecurring: t.isRecurring,
        recurringEndDate: t.recurringEndDate ? new Date(t.recurringEndDate) : null,
        recurringParentId: t.recurringParentId,
        recurringExceptionMonth: t.recurringExceptionMonth,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      });

      if (parents.length > 0) {
        await tx.transaction.createMany({ data: parents.map(toRow) });
      }
      if (exceptions.length > 0) {
        await tx.transaction.createMany({ data: exceptions.map(toRow) });
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/cards");
}
