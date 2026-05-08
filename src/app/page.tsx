import { prisma } from "@/lib/prisma";
import { TransactionList } from "@/components/transactions/transaction-list";

export default async function Home() {
  const raw = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  const transactions = raw.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <TransactionList transactions={transactions} />;
}
