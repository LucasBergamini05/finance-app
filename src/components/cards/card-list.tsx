"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCard, updateCard, deleteCard } from "@/app/actions";
import type { Card } from "@/types/transaction";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#64748b", "#1e293b",
];

type FormState = {
  name: string;
  lastFourDigits: string;
  color: string;
  closingDayType: "FIXED" | "RELATIVE";
  closingDay: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  lastFourDigits: "",
  color: PRESET_COLORS[5],
  closingDayType: "FIXED",
  closingDay: "10",
};

function closingDayLabel(card: Card) {
  return card.closingDayType === "FIXED"
    ? `Fecha dia ${card.closingDay}`
    : `Fecha ${card.closingDay} dias antes do fim`;
}

export function CardList({ cards }: { cards: Card[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(card: Card) {
    setEditing(card);
    setForm({
      name: card.name,
      lastFourDigits: card.lastFourDigits ?? "",
      color: card.color,
      closingDayType: card.closingDayType,
      closingDay: String(card.closingDay),
    });
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const closingDay = parseInt(form.closingDay, 10);
    if (isNaN(closingDay) || closingDay < 1) return;

    const payload = {
      name: form.name.trim(),
      lastFourDigits: form.lastFourDigits.trim() || undefined,
      color: form.color,
      closingDayType: form.closingDayType,
      closingDay,
    };

    startTransition(async () => {
      if (editing) {
        await updateCard(editing.id, payload);
      } else {
        await createCard(payload);
      }
      setFormOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteCard(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  const maxClosingDay = form.closingDayType === "FIXED" ? 28 : 15;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Cartões</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">Nenhum cartão cadastrado.</p>
          <Button variant="outline" className="mt-4" onClick={openAdd}>
            Adicionar primeiro cartão
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden bg-card">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-sm"
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: card.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {card.name}
                  {card.lastFourDigits && (
                    <span className="text-muted-foreground font-normal">
                      {" "}···· {card.lastFourDigits}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {closingDayLabel(card)}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openEdit(card)}
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(card)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Nubank"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Últimos 4 dígitos{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (opcional)
                </span>
              </label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={form.lastFourDigits}
                onChange={(e) =>
                  set("lastFourDigits", e.target.value.replace(/\D/g, ""))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fechamento</label>
                <Select
                  value={form.closingDayType}
                  onValueChange={(v) =>
                    set("closingDayType", v as "FIXED" | "RELATIVE")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Dia fixo</SelectItem>
                    <SelectItem value="RELATIVE">Dias antes do fim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {form.closingDayType === "FIXED" ? "Dia (1–28)" : "Dias (1–15)"}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={maxClosingDay}
                  value={form.closingDay}
                  onChange={(e) => set("closingDay", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      form.color === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => set("color", c)}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!form.name.trim() || isPending}>
                {isPending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
