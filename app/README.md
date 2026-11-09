# Web2 - API Loja (Node + Express + TypeScript + Prisma + PostgreSQL)

API REST de categorias e produtos, baseada no projeto da disciplina
(Desenvolvimento de Software para Web - UFC Quixadá).

## Estrutura

```
src/
├── lib/prisma.ts
├── schemas/index.ts          # validação com zod
├── services/                 # acesso ao banco (Prisma)
├── controllers/
├── routes/index.ts
├── middlewares/errorHandler.ts
├── app.ts
└── server.ts
prisma/
├── schema.prisma             # modelos Category e Product
├── migrations/               # SQL gerado pelo prisma migrate
└── seed.ts                   # dados iniciais
tests/
├── migrations.test.ts        # estrutura e dados do banco
└── api.test.ts               # testes da API rodando no container
Dockerfile
.github/workflows/ci.yml
```

## Rodando localmente

```bash
npm install
cp .env.example .env            # ajuste DATABASE_URL
npx prisma migrate dev          # cria as tabelas
npm run seed                    # dados iniciais
npm run dev
```

Ou tudo via Docker:

```bash
docker compose up --build       # API em http://localhost:3000
```

## Docker

```bash
docker build -t web2-loja-api .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." web2-loja-api
```

Ao iniciar, o container executa `prisma migrate deploy` e depois sobe a API.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | /health | verifica conexão com o banco |
| GET/POST | /categories | lista / cria categoria |
| GET/PATCH/DELETE | /categories/:id | detalhe / atualiza / remove |
| GET/POST | /products | lista (filtros `active`, `categoryId`, `minPrice`, `maxPrice`, `page`, `limit`) / cria |
| GET/PATCH/DELETE | /products/:id | detalhe / atualiza / remove |

```bash
curl -X POST localhost:3000/categories -H "Content-Type: application/json" -d '{"name":"Games"}'
curl "localhost:3000/products?active=true&page=1&limit=5"
```

## GitHub Actions

O workflow `.github/workflows/ci.yml`:

1. Sobe um container PostgreSQL como *service* (só existe durante o job).
2. Faz o build da imagem Docker da API.
3. Roda a imagem, que aplica as migrations no banco.
4. Confere `prisma migrate status` e roda o seed.
5. Executa os testes:
   - estrutura: tabelas, colunas, tipos, nulabilidade, PKs, FK, índices;
   - dados: registros do seed, constraints de unique e FK;
   - API: health, listagem com filtros, CRUD e tratamento de erros.

### Variáveis de ambiente no GitHub

Em **Settings > Secrets and variables > Actions**, cadastre:

| Tipo | Nome | Exemplo |
|---|---|---|
| Variable | `POSTGRES_USER` | `web2` |
| Variable | `POSTGRES_DB` | `loja` |
| Secret | `POSTGRES_PASSWORD` | `uma-senha-forte` |

Com o GitHub CLI:

```bash
gh variable set POSTGRES_USER --body web2
gh variable set POSTGRES_DB --body loja
gh secret set POSTGRES_PASSWORD --body 'uma-senha-forte'
```
