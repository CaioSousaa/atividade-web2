import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

// Valida o resultado de `prisma migrate deploy` + `prisma db seed`:
// estrutura (tabelas, colunas, constraints) e dados do banco.

const prisma = new PrismaClient();
after(() => prisma.$disconnect());

type Column = { column_name: string; data_type: string; is_nullable: string };

const columnsOf = (table: string) =>
  prisma.$queryRaw<Column[]>`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = ${table}
    ORDER BY ordinal_position`;

test("todas as migrations foram aplicadas", async () => {
  const rows = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
    SELECT migration_name, finished_at FROM "_prisma_migrations"`;
  assert.ok(rows.length > 0, "nenhuma migration registrada");
  for (const row of rows) {
    assert.ok(row.finished_at, `migration ${row.migration_name} não terminou`);
  }
});

test("tabelas Category e Product existem", async () => {
  const rows = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'`;
  const names = rows.map((r) => r.table_name);
  assert.ok(names.includes("Category"));
  assert.ok(names.includes("Product"));
});

test("estrutura da tabela Category", async () => {
  const cols = await columnsOf("Category");
  assert.deepEqual(
    cols.map((c) => [c.column_name, c.data_type, c.is_nullable]),
    [
      ["id", "integer", "NO"],
      ["name", "text", "NO"],
      ["description", "text", "YES"],
      ["createdAt", "timestamp without time zone", "NO"],
    ],
  );
});

test("estrutura da tabela Product", async () => {
  const cols = await columnsOf("Product");
  assert.deepEqual(
    cols.map((c) => [c.column_name, c.data_type, c.is_nullable]),
    [
      ["id", "integer", "NO"],
      ["name", "text", "NO"],
      ["price", "numeric", "NO"],
      ["stock", "integer", "NO"],
      ["active", "boolean", "NO"],
      ["categoryId", "integer", "NO"],
      ["createdAt", "timestamp without time zone", "NO"],
    ],
  );
});

test("constraints: PKs, unique em Category.name e FK Product -> Category", async () => {
  const rows = await prisma.$queryRaw<{ constraint_name: string; constraint_type: string }[]>`
    SELECT constraint_name, constraint_type FROM information_schema.table_constraints
    WHERE table_schema = current_schema() AND table_name IN ('Category', 'Product')`;
  const has = (name: string, type: string) =>
    rows.some((r) => r.constraint_name === name && r.constraint_type === type);

  assert.ok(has("Category_pkey", "PRIMARY KEY"));
  assert.ok(has("Product_pkey", "PRIMARY KEY"));
  assert.ok(has("Product_categoryId_fkey", "FOREIGN KEY"));

  const idx = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE schemaname = current_schema()`;
  const indexes = idx.map((i) => i.indexname);
  assert.ok(indexes.includes("Category_name_key"), "índice único de Category.name ausente");
  assert.ok(indexes.includes("Product_categoryId_idx"), "índice de Product.categoryId ausente");
});

test("dados do seed foram inseridos", async () => {
  const categories = await prisma.category.findMany({
    where: { name: { in: ["Eletrônicos", "Livros", "Papelaria"] } },
    include: { products: true },
    orderBy: { name: "asc" },
  });
  assert.deepEqual(
    categories.map((c) => [c.name, c.products.length]),
    [
      ["Eletrônicos", 3],
      ["Livros", 2],
      ["Papelaria", 1],
    ],
  );

  const teclado = await prisma.product.findFirstOrThrow({ where: { name: "Teclado Mecânico" } });
  assert.equal(teclado.price.toString(), "349");
  assert.equal(teclado.stock, 10);
  assert.equal(teclado.active, true);

  assert.equal(await prisma.product.count({ where: { active: false } }), 1);
});

test("banco rejeita produto com categoria inexistente (FK)", async () => {
  await assert.rejects(
    prisma.product.create({ data: { name: "Órfão", price: 1, categoryId: 999999 } }),
    (err: { code?: string }) => err.code === "P2003",
  );
});

test("banco rejeita categoria duplicada (unique)", async () => {
  await assert.rejects(
    prisma.category.create({ data: { name: "Livros" } }),
    (err: { code?: string }) => err.code === "P2002",
  );
});
