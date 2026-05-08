"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTransaction, updateTransaction } from "@/app/actions";
import type { Transaction } from "@/types/transaction";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data obrigatória"),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const defaultValues: FormData = {
  type: "EXPENSE",
  description: "",
  amount: 0,
  date: todayISO(),
  category: "",
  notes: "",
};

export function TransactionForm({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date.slice(0, 10),
          category: transaction.category ?? "",
          notes: transaction.notes ?? "",
        });
      } else {
        reset({ ...defaultValues, date: todayISO() });
      }
    }
  }, [open, transaction, reset]);

  function onSubmit(data: FormData) {
    startTransition(async () => {
      if (isEditing) {
        await updateTransaction(transaction.id, data);
      } else {
        await createTransaction(data);
      }
      onClose();
    });
  }

  const typeValue = watch("type");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={typeValue}
              onValueChange={(v) => setValue("type", v as "INCOME" | "EXPENSE")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Receita</SelectItem>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <Input {...register("description")} placeholder="Ex: Salário" />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data</label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Categoria{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (opcional)
              </span>
            </label>
            <Input {...register("category")} placeholder="Ex: Alimentação" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Notas{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (opcional)
              </span>
            </label>
            <Input {...register("notes")} placeholder="Observações..." />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
