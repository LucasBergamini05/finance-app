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
import { createCategory, updateCategory, deleteCategory } from "@/app/actions";
import type { Category } from "@/types/transaction";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#64748b", "#1e293b",
];

export function CategoryList({ categories }: { categories: Category[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[7]);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[7]);
    setFormOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), color });
      } else {
        await createCategory({ name: name.trim(), color });
      }
      setFormOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>
          <Button variant="outline" className="mt-4" onClick={openAdd}>
            Adicionar primeira categoria
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden bg-card">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-sm"
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 font-medium">{cat.name}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openEdit(cat)}
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(cat)}
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
            <DialogTitle>
              {editing ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alimentação"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
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
              <Button type="submit" disabled={!name.trim() || isPending}>
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
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; será excluída permanentemente.
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
