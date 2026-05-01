# Logger

Aplicação de coleta e consulta de logs usando **Laravel (API)** + **Next.js (Web)** + **OpenSearch**.

## Requisitos

- Docker + Docker Compose

## Subir o projeto

Na raiz do repositório:

```bash
docker compose up -d
```

Os containers principais são:

- **API (Laravel)**: `http://localhost:8000`
- **Web (Next.js)**: `http://localhost:3002`
- **OpenSearch**: `http://localhost:9200`
- **OpenSearch Dashboards**: `http://localhost:5601`

> A `web` depende do `api` e usa o `API_URL` apontando para `http://localhost:8000/api` (veja `docker-compose.yml`).

## Fluxo de autenticação (visão rápida)

- Faça login em `http://localhost:3002/login`
- O BFF do Next salva um cookie `HttpOnly` `logger_auth_token`
- Rotas protegidas (ex: `/logs`) verificam esse cookie no layout protegido

## Logs

### Ingestão (API)

Endpoint para enviar log (processamento assíncrono):

- `POST /api/logs`

### Consulta (API)

Endpoint para listar logs (OpenSearch):

- `GET /api/logs`

Exemplo:

```bash
curl -s "http://localhost:8000/api/logs?page=1&per_page=50&sort=received_at&order=desc" \
  -H "Authorization: Bearer <seu-token>"
```

### Painel (Web)

- Tela: `http://localhost:3002/logs`
- Filtros em drawer + paginação usando o `meta` retornado pela API

## Seed de logs no OpenSearch

Existe um seeder que **gera logs dinamicamente** e **indexa no OpenSearch via `_bulk`** (para volume alto).

Rodar no container `api`:

```bash
docker compose exec -T api php artisan db:seed --class=Database\\Seeders\\LogsOpenSearchSeeder --no-interaction
```

Variáveis úteis:

- `LOGS_SEED_COUNT` (default `1_000_000`)
- `LOGS_SEED_BATCH` (default `1000`, máx `5000`)
- `LOGS_SEED_ENV` (`local|staging|production|random`, default `local`)
- `LOGS_SEED_DAYS_RANGE` (default `180`)

Exemplo (1 milhão em `production`, em lotes de 2000, espalhando datas em 1 ano):

```bash
docker compose exec -T api sh -lc 'LOGS_SEED_ENV=production LOGS_SEED_COUNT=1000000 LOGS_SEED_BATCH=2000 LOGS_SEED_DAYS_RANGE=365 php artisan db:seed --class=Database\\Seeders\\LogsOpenSearchSeeder --no-interaction'
```

> Observação: o projeto não depende de banco de dados para funcionar; o `DatabaseSeeder` foi deixado vazio para não exigir driver/conexão ao rodar `php artisan db:seed`.

## Testes

### API (Laravel)

```bash
docker compose exec -T api php artisan test --compact
```

### Web (Next.js)

```bash
docker compose exec -T web npm test
docker compose exec -T web npm run lint
```

## Troubleshooting

### `/logs` mostra poucos resultados

- Clique em **Limpar** para remover filtros ativos no drawer e/ou querystring.
- Verifique se o `environment` dos logs seedados bate com o que você espera (`LOGS_SEED_ENV`).

### Seed falha por OpenSearch indisponível

- Confirme se o container `opensearch` está **healthy**:

```bash
docker compose ps
```

- Teste o OpenSearch:

```bash
curl -fsS "http://localhost:9200" >/dev/null && echo OK
```

