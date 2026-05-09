"use client";

import { Pencil, Trash2, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransactionView } from "@/types/transaction";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT_CARD: "Crédito",
  PIX: "PIX",
  TRANSFER: "TED/DOC",
};

export function TransactionRow({
  view: v,
  onEdit,
  onDelete,
}: {
  view: TransactionView;
  onEdit: (v: TransactionView) => void;
  onDelete: (v: TransactionView) => void;
}) {
  const isInstallment = v.installments > 1;

  const descriptionLabel = isInstallment
    ? `${v.description} (${v.installmentIndex}/${v.installments})`
    : v.description;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-sm">
      {/* Date */}
      <span className="text-muted-foreground w-11 shrink-0 tabular-nums">
        {formatDate(v.virtualDate)}
      </span>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate flex items-center gap-1.5">
          {v.isRecurring && (
            <Repeat2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          {descriptionLabel}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {v.category && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: v.category.color }}
              />
              {v.category.name}
            </span>
          )}
          {v.paymentMethod && (
            <span className="text-xs text-muted-foreground">
              {v.category ? "·" : ""}{" "}
              {PAYMENT_LABELS[v.paymentMethod]}
              {v.card && (
                <>
                  {" "}
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: v.card.color }}
                  />
                  {" "}
                  {v.card.name}
                  {v.card.lastFourDigits && ` ···· ${v.card.lastFourDigits}`}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Type badge (desktop only) */}
      <span
        className={`hidden sm:inline-flex shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          v.type === "INCOME"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {v.type === "INCOME" ? "Receita" : "Despesa"}
      </span>

      {/* Amount */}
      <span
        className={`shrink-0 font-semibold tabular-nums w-24 text-right ${
          v.type === "INCOME"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500 dark:text-red-400"
        }`}
      >
        {v.type === "INCOME" ? "+" : "−"}
        {formatCurrency(v.displayAmount)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(v)}
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(v)}
          aria-label="Excluir"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
