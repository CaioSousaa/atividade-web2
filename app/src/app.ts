import express from "express";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());
app.use(routes);
app.use((_req, res) => void res.status(404).json({ erro: "Rota não encontrada" }));
app.use(errorHandler);
