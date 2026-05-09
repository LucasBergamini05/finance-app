"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MonthGroup } from "./month-group";
import { TransactionForm } from "./transaction-form";
import {
  deleteTransaction,
  deleteRecurringThisMonth,
  deleteRecurringThisAndFollowing,
  updateRecurringThisMonth,
  updateRecurringThisAndFollowing,
} from "@/app/actions";
import type {
  Transaction,
  TransactionView,
  Category,
  Card,
  TransactionFormData,
} from "@/types/transaction";

function groupByMonth(views: TransactionView[]) {
  const groups: Record<string, TransactionView[]> = {};
  for (const v of views) {
    const key = v.virtualDate.slice(0, 7);
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

type ScopeDialog = {
  view: TransactionView;
  action: "edit" | "delete";
};

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
  const [onSubmitOverride, setOnSubmitOverride] = useState<
    ((data: TransactionFormData) => Promise<void>) | undefined
  >(undefined);

  const [scopeDialog, setScopeDialog] = useState<ScopeDialog | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<TransactionView | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleEdit(view: TransactionView) {
    if (view.isRecurring) {
      setScopeDialog({ view, action: "edit" });
    } else {
      const original = transactions.find((t) => t.id === view.id) ?? view;
      setEditing(original);
      setOnSubmitOverride(undefined);
      setFormOpen(true);
    }
  }

  function handleDelete(view: TransactionView) {
    if (view.isRecurring) {
      setScopeDialog({ view, action: "delete" });
    } else {
      setDeleteDialog(view);
    }
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
    setOnSubmitOverride(undefined);
  }

  function confirmScopeEdit(scope: "month" | "following") {
    const view = scopeDialog!.view;
    setScopeDialog(null);

    // view already contains the correct data (exception or parent)
    setEditing(view as unknown as Transaction);

    const month = view.recurringMonth!;
    const parentId = view.id;
    const exceptionId = view.exceptionId;

    if (scope === "month") {
      setOnSubmitOverride(
        () => (data: TransactionFormData) =>
          updateRecurringThisMonth(parentId, month, exceptionId, data)
      );
    } else {
      setOnSubmitOverride(
        () => (data: TransactionFormData) =>
          updateRecurringThisAndFollowing(parentId, month, data)
      );
    }
    setFormOpen(true);
  }

  function confirmScopeDelete(scope: "month" | "following") {
    const view = scopeDialog!.view;
    setScopeDialog(null);
    const month = view.recurringMonth!;
    const parentId = view.id;
    const exceptionId = view.exceptionId;

    startTransition(async () => {
      if (scope === "month") {
        await deleteRecurringThisMonth(parentId, month, exceptionId);
      } else {
        await deleteRecurringThisAndFollowing(parentId, month);
      }
    });
  }

  function confirmDelete() {
    if (!deleteDialog) return;
    const id = deleteDialog.id;
    setDeleteDialog(null);
    startTransition(() => deleteTransaction(id));
  }

  const groups = groupByMonth(views);
  const isRecurringScope = scopeDialog?.action === "edit" ? "Editar" : "Excluir";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
        <Button onClick={() => setFormOpen(true)}>
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
              onDelete={handleDelete}
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
        onSubmitOverride={onSubmitOverride}
      />

      {/* Scope picker dialog for recurring edit/delete */}
      <Dialog
        open={!!scopeDialog}
        onOpenChange={(v) => !v && setScopeDialog(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {isRecurringScope} transação recorrente
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{scopeDialog?.view.description}&rdquo; — o que deseja{" "}
            {scopeDialog?.action === "edit" ? "editar" : "excluir"}?
          </p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              onClick={() =>
                scopeDialog?.action === "edit"
                  ? confirmScopeEdit("month")
                  : confirmScopeDelete("month")
              }
              disabled={isPending}
            >
              Somente este mês
            </Button>
            <Button
              variant={scopeDialog?.action === "delete" ? "destructive" : "default"}
              onClick={() =>
                scopeDialog?.action === "edit"
                  ? confirmScopeEdit("following")
                  : confirmScopeDelete("following")
              }
              disabled={isPending}
            >
              Este e os seguintes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple delete confirmation for non-recurring */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(v) => !v && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.installments && deleteDialog.installments > 1
                ? `Isso removerá todas as ${deleteDialog.installments} parcelas. Esta ação não pode ser desfeita.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
