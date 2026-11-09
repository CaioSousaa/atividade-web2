import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { idParam, createProduct, updateProduct, listProducts } from "../schemas";

export const productController = {
  async list(req: Request, res: Response) {
    const filters = listProducts.parse(req.query);
    res.json(await productService.list(filters));
  },

  async get(req: Request, res: Response) {
    const { id } = idParam.parse(req.params);
    const product = await productService.getById(id);
    if (!product) return void res.status(404).json({ erro: "Produto não encontrado" });
    res.json(product);
  },

  async create(req: Request, res: Response) {
    const data = createProduct.parse(req.body);
    res.status(201).json(await productService.create(data));
  },

  async update(req: Request, res: Response) {
    const { id } = idParam.parse(req.params);
    const data = updateProduct.parse(req.body);
    res.json(await productService.update(id, data));
  },

  async remove(req: Request, res: Response) {
    const { id } = idParam.parse(req.params);
    await productService.remove(id);
    res.status(204).send();
  },
};
