import { prisma } from "@/lib/prisma";
import { TransactionList } from "@/components/transactions/transaction-list";
import type { Transaction, TransactionView } from "@/types/transaction";

function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  let m = month - 1 + months;
  const y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
}

function nextMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return next;
}

function expandTransactions(
  transactions: Transaction[],
  exceptionMap: Map<string, Map<string, Transaction>>
): TransactionView[] {
  const views: TransactionView[] = [];
  const todayMonth = new Date().toISOString().slice(0, 7);

  // First pass: expand non-recurring transactions and track latest month
  let latestMonth = todayMonth;
  const recurringTxs: Transaction[] = [];

  for (const t of transactions) {
    if (t.isRecurring) {
      recurringTxs.push(t);
      continue;
    }
    if (t.installments > 1) {
      for (let i = 0; i < t.installments; i++) {
        const virtualDate = addMonths(t.date, i);
        views.push({
          ...t,
          installmentIndex: i + 1,
          virtualDate,
          displayAmount: t.amount / t.installments,
        });
        const m = virtualDate.slice(0, 7);
        if (m > latestMonth) latestMonth = m;
      }
    } else {
      const virtualDate = t.date.slice(0, 10);
      views.push({
        ...t,
        installmentIndex: 1,
        virtualDate,
        displayAmount: t.amount,
      });
      const m = virtualDate.slice(0, 7);
      if (m > latestMonth) latestMonth = m;
    }
  }

  // Second pass: expand recurring transactions up to latestMonth
  for (const t of recurringTxs) {
    const startMonth = t.date.slice(0, 7);
    const endMonth = t.recurringEndDate ? t.recurringEndDate.slice(0, 7) : null;

    let month = startMonth;
    while (month <= latestMonth) {
      if (endMonth && month >= endMonth) break;

      const monthExcs = exceptionMap.get(t.id);
      const exc = monthExcs?.get(month);

      if (exc) {
        if (!exc.deletedAt) {
          views.push({
            ...exc,
            installmentIndex: 1,
            virtualDate: `${month}-01`,
            displayAmount: exc.amount,
            recurringMonth: month,
            exceptionId: exc.id,
          });
        }
        // exc.deletedAt → skip this month
      } else {
        views.push({
          ...t,
          installmentIndex: 1,
          virtualDate: `${month}-01`,
          displayAmount: t.amount,
          recurringMonth: month,
        });
      }

      month = nextMonth(month);
    }
  }

  return views.sort((a, b) => b.virtualDate.localeCompare(a.virtualDate));
}

export default async function Home() {
  const [rawTransactions, rawExceptions, categories, rawCards] = await Promise.all([
    prisma.transaction.findMany({
      where: { deletedAt: null, recurringParentId: null },
      orderBy: { date: "desc" },
      include: {
        category: { select: { name: true, color: true } },
        card: { select: { name: true, color: true, lastFourDigits: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { recurringParentId: { not: null } },
      include: {
        category: { select: { name: true, color: true } },
        card: { select: { name: true, color: true, lastFourDigits: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.card.findMany({ orderBy: { name: "asc" } }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapRaw(t: any): Transaction {
    return {
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      recurringEndDate: t.recurringEndDate ? t.recurringEndDate.toISOString() : null,
      deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      type: t.type as Transaction["type"],
      paymentMethod: t.paymentMethod as Transaction["paymentMethod"],
    };
  }

  const transactions: Transaction[] = rawTransactions.map(mapRaw);

  const exceptionMap = new Map<string, Map<string, Transaction>>();
  for (const e of rawExceptions) {
    if (!e.recurringParentId || !e.recurringExceptionMonth) continue;
    const mapped = mapRaw(e);
    if (!exceptionMap.has(e.recurringParentId)) {
      exceptionMap.set(e.recurringParentId, new Map());
    }
    exceptionMap.get(e.recurringParentId)!.set(e.recurringExceptionMonth, mapped);
  }

  const views = expandTransactions(transactions, exceptionMap);

  const cards = rawCards.map((c) => ({
    ...c,
    closingDayType: c.closingDayType as "FIXED" | "RELATIVE",
  }));

  return (
    <TransactionList
      transactions={transactions}
      views={views}
      categories={categories}
      cards={cards}
    />
  );
}
