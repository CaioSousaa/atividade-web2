import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

// Traduz erros de validação e do banco para respostas HTTP

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ erro: "Dados inválidos", detalhes: err.issues });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // violação de campo único
        res.status(409).json({ erro: "Registro duplicado", campo: err.meta?.target });
        return;
      case "P2003": // violação de chave estrangeira
        res.status(409).json({ erro: "Operação viola um relacionamento (categoria inexistente ou com produtos)" });
        return;
      case "P2025": // registro não encontrado em update/delete
        res.status(404).json({ erro: "Registro não encontrado" });
        return;
    }
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
};
