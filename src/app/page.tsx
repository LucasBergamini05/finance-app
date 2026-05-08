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

function expandTransactions(transactions: Transaction[]): TransactionView[] {
  const views: TransactionView[] = [];
  for (const t of transactions) {
    const n = t.installments;
    if (n <= 1) {
      views.push({
        ...t,
        installmentIndex: 1,
        virtualDate: t.date.slice(0, 10),
        displayAmount: t.amount,
      });
    } else {
      for (let i = 0; i < n; i++) {
        views.push({
          ...t,
          installmentIndex: i + 1,
          virtualDate: addMonths(t.date, i),
          displayAmount: t.amount / n,
        });
      }
    }
  }
  return views.sort((a, b) => b.virtualDate.localeCompare(a.virtualDate));
}

export default async function Home() {
  const [rawTransactions, categories, rawCards] = await Promise.all([
    prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { date: "desc" },
      include: {
        category: { select: { name: true, color: true } },
        card: { select: { name: true, color: true, lastFourDigits: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.card.findMany({ orderBy: { name: "asc" } }),
  ]);

  const transactions: Transaction[] = rawTransactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    type: t.type as Transaction["type"],
    paymentMethod: t.paymentMethod as Transaction["paymentMethod"],
  }));

  const views = expandTransactions(transactions);

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
