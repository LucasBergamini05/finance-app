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
import { formatCurrency } from "@/lib/format";
import type { Transaction, Category, Card } from "@/types/transaction";

const schema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    description: z.string().min(1, "Descrição obrigatória"),
    amount: z.number().positive("Valor deve ser positivo"),
    date: z.string().min(1, "Data obrigatória"),
    categoryId: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z
      .enum(["CASH", "DEBIT", "CREDIT_CARD", "PIX", "TRANSFER"])
      .optional(),
    cardId: z.string().optional(),
    installments: z.number().min(1).max(48).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "EXPENSE" &&
      data.paymentMethod === "CREDIT_CARD" &&
      !data.cardId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um cartão",
        path: ["cardId"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT_CARD", label: "Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "TRANSFER", label: "TED/DOC" },
] as const;

export function TransactionForm({
  open,
  onClose,
  transaction,
  categories,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  categories: Category[];
  cards: Card[];
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
    defaultValues: {
      type: "EXPENSE",
      description: "",
      amount: 0,
      date: todayISO(),
      installments: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date.slice(0, 10),
          categoryId: transaction.categoryId ?? undefined,
          notes: transaction.notes ?? "",
          paymentMethod: transaction.paymentMethod ?? undefined,
          cardId: transaction.cardId ?? undefined,
          installments: transaction.installments ?? 1,
        });
      } else {
        reset({
          type: "EXPENSE",
          description: "",
          amount: 0,
          date: todayISO(),
          installments: 1,
        });
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
  const paymentMethod = watch("paymentMethod");
  const cardId = watch("cardId");
  const installments = watch("installments") ?? 1;
  const amount = watch("amount") ?? 0;

  const showPayment = typeValue === "EXPENSE";
  const showCard = showPayment && paymentMethod === "CREDIT_CARD";
  const showInstallments = showCard;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Tipo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={typeValue}
              onValueChange={(v) => {
                setValue("type", v as "INCOME" | "EXPENSE");
                if (v === "INCOME") {
                  setValue("paymentMethod", undefined);
                  setValue("cardId", undefined);
                  setValue("installments", 1);
                }
              }}
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

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <Input {...register("description")} placeholder="Ex: Supermercado" />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Valor + Data */}
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

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Categoria{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (opcional)
              </span>
            </label>
            <Select
              value={(watch("categoryId") as string | undefined) || "__none__"}
              onValueChange={(v) =>
                setValue("categoryId", v === "__none__" ? undefined : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem categoria</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Forma de pagamento (só para EXPENSE) */}
          {showPayment && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Forma de pagamento{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (opcional)
                </span>
              </label>
              <Select
                value={paymentMethod ?? "__none__"}
                onValueChange={(v) => {
                  const val =
                    v === "__none__"
                      ? undefined
                      : (v as FormData["paymentMethod"]);
                  setValue("paymentMethod", val);
                  if (val !== "CREDIT_CARD") {
                    setValue("cardId", undefined);
                    setValue("installments", 1);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Não informado</SelectItem>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cartão (só crédito) */}
          {showCard && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cartão</label>
              {cards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum cartão cadastrado. Adicione em{" "}
                  <span className="font-medium">⚙ → Cartões</span>.
                </p>
              ) : (
                <Select
                  value={(cardId as string | undefined) || ""}
                  onValueChange={(v) => setValue("cardId", v || undefined)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full inline-block"
                            style={{ backgroundColor: card.color }}
                          />
                          {card.name}
                          {card.lastFourDigits && (
                            <span className="text-muted-foreground">
                              ···· {card.lastFourDigits}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.cardId && (
                <p className="text-xs text-destructive">
                  {errors.cardId.message}
                </p>
              )}
            </div>
          )}

          {/* Parcelas (só crédito, só na criação) */}
          {showInstallments && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Parcelas</label>
              <Select
                value={String(installments)}
                onValueChange={(v) => setValue("installments", Number(v) || 1)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">À vista</SelectItem>
                  {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {installments > 1 && amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {installments}× de{" "}
                  <span className="font-medium">
                    {formatCurrency(amount / installments)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Notas */}
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
