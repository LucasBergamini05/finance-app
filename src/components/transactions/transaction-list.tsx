"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonthGroup } from "./month-group";
import { TransactionForm } from "./transaction-form";
import { CategoryManager } from "@/components/settings/category-manager";
import { CardManager } from "@/components/settings/card-manager";
import type { Transaction, TransactionView, Category, Card } from "@/types/transaction";

function groupByMonth(views: TransactionView[]) {
  const groups: Record<string, TransactionView[]> = {};
  for (const v of views) {
    const key = v.virtualDate.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export function TransactionList({
  transactions,
  views,
  categories,
  cards,
}: {
  transactions: Transaction[];
  views: TransactionView[];
  categories: Category[];
  cards: Card[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [cardManagerOpen, setCardManagerOpen] = useState(false);

  function handleEdit(view: TransactionView) {
    // Find the original transaction so the form shows the root date/amount
    const original = transactions.find((t) => t.id === view.id) ?? view;
    setEditing(original);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
  }

  const groups = groupByMonth(views);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Controle Financeiro
        </h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md size-8 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setCategoryManagerOpen(true)}
              >
                Categorias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCardManagerOpen(true)}>
                Cartões
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">Nenhuma transação registrada.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setFormOpen(true)}
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
              views={txs}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onClose={handleFormClose}
        transaction={editing}
        categories={categories}
        cards={cards}
      />

      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
      />

      <CardManager
        open={cardManagerOpen}
        onClose={() => setCardManagerOpen(false)}
        cards={cards}
      />
    </div>
  );
}
