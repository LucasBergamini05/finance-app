import { prisma } from "@/lib/prisma";
import { CardList } from "@/components/cards/card-list";

export default async function CardsPage() {
  const rawCards = await prisma.card.findMany({ orderBy: { name: "asc" } });
  const cards = rawCards.map((c) => ({
    ...c,
    closingDayType: c.closingDayType as "FIXED" | "RELATIVE",
  }));
  return <CardList cards={cards} />;
}
