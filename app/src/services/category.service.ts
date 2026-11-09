import { prisma } from "../lib/prisma";

type CategoryData = { name: string; description?: string };

export const categoryService = {
  list: () =>
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: "asc" },
    }),

  getById: (id: number) =>
    prisma.category.findUnique({
      where: { id },
      include: { products: true },
    }),

  create: (data: CategoryData) => prisma.category.create({ data }),

  update: (id: number, data: Partial<CategoryData>) =>
    prisma.category.update({ where: { id }, data }),

  remove: (id: number) => prisma.category.delete({ where: { id } }),
};
