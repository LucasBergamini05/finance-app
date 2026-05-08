"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthGroup } from "./month-group";
import { TransactionForm } from "./transaction-form";
import type { Transaction } from "@/types/transaction";

function groupByMonth(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  function handleEdit(t: Transaction) {
    setEditing(t);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
  }

  const groups = groupByMonth(transactions);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Controle Financeiro
        </h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">Nenhuma transação registrada.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setOpen(true)}
          >
            Adicionar primeira transação
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([month, txs]) => (
            <MonthGroup
              key={month}
              month={month}
              transactions={txs}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <TransactionForm
        open={open}
        onClose={handleClose}
        transaction={editing}
      />
    </div>
  );
}
