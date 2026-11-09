import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados iniciais. upsert torna o seed idempotente (pode rodar várias vezes).
const categories = [
  {
    name: "Eletrônicos",
    description: "Aparelhos e acessórios eletrônicos",
    products: [
      { name: "Fone Bluetooth", price: "199.90", stock: 25 },
      { name: "Teclado Mecânico", price: "349.00", stock: 10 },
      { name: "Mouse Sem Fio", price: "89.90", stock: 40 },
    ],
  },
  {
    name: "Livros",
    description: "Livros técnicos e de literatura",
    products: [
      { name: "Clean Code", price: "120.00", stock: 8 },
      { name: "Dom Casmurro", price: "35.50", stock: 15 },
    ],
  },
  {
    name: "Papelaria",
    description: null,
    products: [{ name: "Caderno 10 matérias", price: "29.90", stock: 100, active: false }],
  },
];

async function main() {
  for (const { products, ...category } of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });

    for (const product of products) {
      const exists = await prisma.product.findFirst({
        where: { name: product.name, categoryId: saved.id },
      });
      if (!exists) {
        await prisma.product.create({ data: { ...product, categoryId: saved.id } });
      }
    }
  }
  console.log("Seed concluído");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
