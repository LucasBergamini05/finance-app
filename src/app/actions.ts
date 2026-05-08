"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TransactionFormData } from "@/types/transaction";

export async function createTransaction(data: TransactionFormData) {
  await prisma.transaction.create({
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      category: data.category || null,
      notes: data.notes || null,
    },
  });
  revalidatePath("/");
}

export async function updateTransaction(id: string, data: TransactionFormData) {
  await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      category: data.category || null,
      notes: data.notes || null,
    },
  });
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
}
