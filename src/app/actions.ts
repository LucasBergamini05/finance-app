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
