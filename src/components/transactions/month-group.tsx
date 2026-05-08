"use client";

import { TransactionRow } from "./transaction-row";
import type { Transaction } from "@/types/transaction";

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function MonthGroup({
  month,
  transactions,
  onEdit,
}: {
  month: string;
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
}) {
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-base font-semibold">{formatMonthLabel(month)}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400">
            Receitas: {formatCurrency(totalIncome)}
          </span>
          <span className="text-red-500 dark:text-red-400">
            Despesas: {formatCurrency(totalExpense)}
          </span>
          <span
            className={
              balance >= 0
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-red-500 dark:text-red-400 font-medium"
            }
          >
            Saldo: {formatCurrency(balance)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border divide-y overflow-hidden bg-card">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
