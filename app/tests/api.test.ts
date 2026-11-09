import { test } from "node:test";
import assert from "node:assert/strict";

// Testes ponta a ponta contra a API rodando (ex.: container Docker).
// Só executa quando API_URL estiver definida.

const API_URL = process.env.API_URL;
const opts = { skip: !API_URL && "API_URL não definida" };

const call = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = res.status === 204 ? null : await res.json();
  return { status: res.status, body };
};

test("GET /health", opts, async () => {
  const { status, body } = await call("/health");
  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("GET /categories retorna dados do seed", opts, async () => {
  const { status, body } = await call("/categories");
  assert.equal(status, 200);
  const names = body.map((c: { name: string }) => c.name);
  assert.ok(names.includes("Eletrônicos"));
  assert.ok(names.includes("Livros"));
});

test("GET /products com filtro e paginação", opts, async () => {
  const { status, body } = await call("/products?active=true&page=1&limit=2");
  assert.equal(status, 200);
  assert.equal(body.data.length, 2);
  assert.equal(body.meta.total, 5);
  assert.equal(body.meta.pages, 3);
});

test("CRUD de produto", opts, async () => {
  const cat = await call("/categories", {
    method: "POST",
    body: JSON.stringify({ name: `Teste ${Date.now()}` }),
  });
  assert.equal(cat.status, 201);

  const created = await call("/products", {
    method: "POST",
    body: JSON.stringify({ name: "Produto CI", price: 10.5, stock: 3, categoryId: cat.body.id }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.price, "10.5");

  const updated = await call(`/products/${created.body.id}`, {
    method: "PATCH",
    body: JSON.stringify({ stock: 7 }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.stock, 7);

  // categoria com produto não pode ser removida (FK)
  assert.equal((await call(`/categories/${cat.body.id}`, { method: "DELETE" })).status, 409);

  assert.equal((await call(`/products/${created.body.id}`, { method: "DELETE" })).status, 204);
  assert.equal((await call(`/products/${created.body.id}`)).status, 404);
  assert.equal((await call(`/categories/${cat.body.id}`, { method: "DELETE" })).status, 204);
});

test("validação e erros", opts, async () => {
  assert.equal((await call("/products", { method: "POST", body: "{}" })).status, 400);
  assert.equal(
    (await call("/categories", { method: "POST", body: JSON.stringify({ name: "Livros" }) })).status,
    409,
  );
  assert.equal((await call("/rota-inexistente")).status, 404);
});
