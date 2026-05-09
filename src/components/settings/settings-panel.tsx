"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
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
import { exportData, importData, type BackupData } from "@/app/actions";

export function SettingsPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financas-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setMessage(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || parsed.version !== 1) {
        setError("Arquivo inválido: versão não suportada.");
        return;
      }
      setPendingImport(parsed);
    } catch {
      setError("Não foi possível ler o arquivo (JSON inválido).");
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    const data = pendingImport;
    setPendingImport(null);
    startTransition(async () => {
      try {
        await importData(data);
        setMessage("Importação concluída.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro na importação.");
      }
    });
  }

  const counts = pendingImport
    ? {
        categories: (pendingImport.categories ?? []).length,
        cards: (pendingImport.cards ?? []).length,
        transactions: (pendingImport.transactions ?? []).length,
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Dados</h1>

      <div className="space-y-6">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-1">Exportar</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Baixa um arquivo JSON com todas as categorias, cartões e transações.
          </p>
          <Button onClick={handleExport} disabled={isPending}>
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-1">Importar</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Substitui <strong>todos</strong> os dados atuais pelo conteúdo do
            arquivo. Esta operação não pode ser desfeita.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4" />
            Selecionar arquivo
          </Button>
        </section>

        {message && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <AlertDialog
        open={!!pendingImport}
        onOpenChange={(v) => !v && setPendingImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importação?</AlertDialogTitle>
            <AlertDialogDescription>
              {counts && (
                <>
                  Serão importadas {counts.categories} categorias,{" "}
                  {counts.cards} cartões e {counts.transactions} transações.
                  Todos os dados atuais serão apagados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} disabled={isPending}>
              Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
