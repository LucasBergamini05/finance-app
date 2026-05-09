import { prisma } from "@/lib/prisma";
import { CategoryList } from "@/components/categories/category-list";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return <CategoryList categories={categories} />;
}
