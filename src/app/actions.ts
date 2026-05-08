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

export async function createTransaction(data: TransactionFormData) {
  const installments =
    data.paymentMethod === "CREDIT_CARD" ? (data.installments ?? 1) : 1;

  await prisma.transaction.create({
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      categoryId: data.categoryId || null,
      notes: data.notes || null,
      paymentMethod: data.paymentMethod ?? null,
      cardId: data.cardId || null,
      installments,
    },
  });

  revalidatePath("/");
}

export async function updateTransaction(
  id: string,
  data: TransactionFormData
) {
  const installments =
    data.paymentMethod === "CREDIT_CARD" ? (data.installments ?? 1) : 1;

  await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      categoryId: data.categoryId || null,
      notes: data.notes || null,
      paymentMethod: data.paymentMethod ?? null,
      cardId: data.cardId || null,
      installments,
    },
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
