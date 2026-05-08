"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/app/actions";
import { formatCurrency } from "./month-group";
import type { Transaction } from "@/types/transaction";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function TransactionRow({
  transaction: t,
  onEdit,
}: {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(t.id);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-sm">
      <span className="text-muted-foreground w-11 shrink-0 tabular-nums">
        {formatDate(t.date)}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{t.description}</p>
        {t.category && (
          <p className="text-xs text-muted-foreground truncate">{t.category}</p>
        )}
      </div>

      <span
        className={`hidden sm:inline-flex shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          t.type === "INCOME"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {t.type === "INCOME" ? "Receita" : "Despesa"}
      </span>

      <span
        className={`shrink-0 font-semibold tabular-nums w-24 text-right ${
          t.type === "INCOME"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
        }`}
      >
        {t.type === "INCOME" ? "+" : "−"}
        {formatCurrency(t.amount)}
      </span>

      {confirming ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="destructive"
            size="xs"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "…" : "Excluir"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(t)}
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setConfirming(true)}
            aria-label="Excluir"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
