import { Router } from "express";
import { categoryController as c } from "../controllers/category.controller";
import { productController as p } from "../controllers/product.controller";
import { prisma } from "../lib/prisma";

export const routes = Router();

routes.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

routes.get("/categories", c.list);
routes.get("/categories/:id", c.get);
routes.post("/categories", c.create);
routes.patch("/categories/:id", c.update);
routes.delete("/categories/:id", c.remove);

routes.get("/products", p.list);
routes.get("/products/:id", p.get);
routes.post("/products", p.create);
routes.patch("/products/:id", p.update);
routes.delete("/products/:id", p.remove);
