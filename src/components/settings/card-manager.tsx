"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { createCard, updateCard, deleteCard } from "@/app/actions";
import type { Card } from "@/types/transaction";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#1e293b",
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
  if (card.closingDayType === "FIXED") return `Fecha dia ${card.closingDay}`;
  return `Fecha ${card.closingDay} dias antes do fim`;
}

export function CardManager({
  open,
  onClose,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  cards: Card[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(card: Card) {
    setEditingId(card.id);
    setForm({
      name: card.name,
      lastFourDigits: card.lastFourDigits ?? "",
      color: card.color,
      closingDayType: card.closingDayType,
      closingDay: String(card.closingDay),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const closingDay = parseInt(form.closingDay, 10);
    if (isNaN(closingDay) || closingDay < 1) return;

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        lastFourDigits: form.lastFourDigits.trim() || undefined,
        color: form.color,
        closingDayType: form.closingDayType,
        closingDay,
      };
      if (editingId) {
        await updateCard(editingId, payload);
      } else {
        await createCard(payload);
      }
      resetForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCard(id);
    });
  }

  const maxClosingDay = form.closingDayType === "FIXED" ? 28 : 15;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cartões</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum cartão cadastrado
              </p>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: card.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {card.name}
                      {card.lastFourDigits && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          ···· {card.lastFourDigits}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {closingDayLabel(card)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleEdit(card)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={isPending}
                    onClick={() => handleDelete(card.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">
              {editingId ? "Editar cartão" : "Novo cartão"}
            </p>

            <Input
              placeholder="Nome do cartão"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />

            <Input
              placeholder="Últimos 4 dígitos (opcional)"
              maxLength={4}
              value={form.lastFourDigits}
              onChange={(e) =>
                set("lastFourDigits", e.target.value.replace(/\D/g, ""))
              }
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Fechamento
                </label>
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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
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

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Cor
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
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

            <div className="flex gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!form.name.trim() || isPending}
              >
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
