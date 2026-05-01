# Horus

Aplicação **Horus** de coleta e consulta de logs usando **Laravel (API)** + **Next.js (Web)** + **OpenSearch**.

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

> A `web` precisa da variável **`API_URL`** (ex.: `http://localhost:8000/api`) no ambiente do Next — configure em `web/.env` no desenvolvimento local.

## Fluxo de autenticação (visão rápida)

- Faça login em `http://localhost:3002/login`
- O BFF do Next salva um cookie `HttpOnly` **`horus_auth_token`**
- Rotas protegidas (ex.: `/`, `/logs`) usam esse cookie no proxy/layout; a API valida o Bearer Sanctum nas chamadas BFF

### Nome do produto, sessão e o que não é rebranding

- **Nome do produto:** Horus (UI, documentação, `APP_NAME` sugerido em `api/.env.example`, título OpenAPI).
- **Mudança com impacto em sessão:** o cookie HttpOnly passou de `elog_auth_token` para **`horus_auth_token`**; a chave de storage no cliente passou de `elog:auth:token` para **`horus:auth:token`**. Após deploy desta versão, usuários com sessão antiga precisam **fazer login de novo** (o middleware e o BFF já não leem os nomes antigos).
- **Header interno do middleware:** `x-horus-pathname` (substitui `x-elog-pathname`; nenhum outro arquivo lia esse header).
- **Sem alteração de propósito:** padrão de índices OpenSearch `logs-*`, fila `logs`, e arquivos compilados em `api/storage/framework/views/*.php` (contêm caminhos absolutos do host ao compilar Blade — cache do Laravel, não documentação do produto).

## Logs

### Ingestão (API)

Endpoint para enviar log (processamento assíncrono):

- `POST /api/logs`

### Consulta (API)

Endpoint para listar logs (OpenSearch):

- `GET /api/logs`

Agregações para o dashboard (mesma autenticação):

- `GET /api/logs/summary`

Exemplo:

```bash
curl -s "http://localhost:8000/api/logs?page=1&per_page=50&sort=received_at&order=desc" \
  -H "Authorization: Bearer <seu-token>"
```

### Painel (Web)

- Dashboard: `http://localhost:3002/` (resumo via `GET /api/logs/summary`)
- Listagem: `http://localhost:3002/logs` (filtros em drawer + paginação com `meta` da API)

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

## Publicação em produção

Este repositório é um monólito **API Laravel** + **frontend Next.js (BFF)** + **OpenSearch** + **Redis** + **MySQL**. Em produção, todos os serviços com os quais a API fala precisam estar acessíveis pela rede da aplicação (URLs internas ou públicas, conforme a arquitetura).

### Serviços necessários

| Serviço | Uso |
|--------|-----|
| **MySQL** | Usuários, tokens Sanctum (`personal_access_tokens`), filas/cache se você optar por `database` em vez de Redis. |
| **Redis** | Recomendado para **fila** (`QUEUE_CONNECTION=redis`), **cache** e **sessão** em carga real; o `docker-compose` local já usa Redis para fila e worker de logs. |
| **OpenSearch 2.x** | Armazenamento e busca dos documentos de log (`logs-*`). A API usa HTTP JSON (`/_search`, `/_bulk`). |
| **Worker PHP** | Processamento assíncrono da fila **`logs`** após `POST /api/logs`; sem worker, a ingestão não conclui. |
| **API Laravel** | HTTP + PHP 8.4; health interno Laravel em `GET /up` (rota padrão do framework). |
| **Next.js** | Interface e rotas `app/api/*` que fazem *proxy* para a API com o cookie de sessão. |

**OpenSearch Dashboards** é opcional (apenas operação/visualização).

### Variáveis de ambiente — API (`api/.env`)

Copie a partir de `api/.env.example` e ajuste no ambiente de deploy.

- **Obrigatórias de aplicação:** `APP_KEY` (gerar com `php artisan key:generate`), `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` (URL pública da API, ex.: `https://api.seudominio.com`).
- **Banco:** `DB_*` — necessário para login/registro Sanctum e testes que usam usuário real.
- **Redis (recomendado em produção):** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` se aplicável; alinhar `QUEUE_CONNECTION`, `CACHE_STORE`, `SESSION_DRIVER` ao Redis (como no `docker-compose` de referência).
- **OpenSearch:** `OPENSEARCH_URL` (ex.: `https://opensearch.sua-rede-interna:9200`), `OPENSEARCH_TIMEOUT`.
- **Auth externo (se usado):** `AUTH_SERVER_URL`, `AUTH_SERVER_TIMEOUT` — conforme `config/services.php`.

Em produção, **não** use o OpenSearch com `plugins.security.disabled=true` como no compose de desenvolvimento; configure TLS, usuário/senha ou outro modelo de segurança aceito pelo seu cluster.

### Variáveis de ambiente — Web (`web/.env`)

- **`API_URL`** (obrigatória no servidor Next): URL **base da API Laravel incluindo o prefixo `/api`**, sem barra final desnecessária. Ex.: `https://api.seudominio.com/api`. Usada nas rotas BFF (`/api/logs`, login, etc.) e nos *Server Components* que chamam a API diretamente (dashboard).
- **`NODE_ENV=production`** para cookies `Secure` no login e otimizações de build.

Garanta que o navegador consiga chamar a API (CORS não é exigido para o fluxo atual se o browser só fala com o mesmo domínio do Next; chamadas diretas de outro origem exigiriam CORS na API).

### Comandos típicos de publicação

**API (primeiro deploy ou release novo)**

```bash
cd api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Mantenha um processo supervisor (systemd, Supervisor, Kubernetes Deployment, etc.) para:

```bash
php artisan queue:work redis --queue=logs --tries=3 --timeout=120
```

(ajuste `--queue` e driver se mudar a configuração.)

Servir HTTP com PHP-FPM + Nginx, **ou** `php artisan serve` apenas para testes — em produção use FPM ou container equivalente.

**Web**

```bash
cd web
npm ci
npm run build
NODE_ENV=production npm run start
```

Ou faça deploy na plataforma de sua escolha (Vercel, Node em container, etc.), definindo `API_URL` e os *secrets* no painel da plataforma.

### Checklist rápido pós-deploy

1. `GET {APP_URL}/up` responde OK na API.
2. Login na web cria sessão e as páginas `/` (dashboard) e `/logs` carregam sem erro 502/401.
3. OpenSearch acessível pela API (`OPENSEARCH_URL`); índices `logs-*` criados após o primeiro bulk/ingestão.
4. **Worker** em execução: após um `POST /api/logs` aceito, o documento aparece na busca após o processamento da fila.

### Teste opcional contra OpenSearch real (CI)

Com `RUN_OPENSEARCH_SUMMARY_IT=1` e `OPENSEARCH_URL` válidos, o PHPUnit executa `LogStatsSummaryOpenSearchIntegrationTest` (criação de índice temporário, bulk, summary, limpeza). Ver `api/.env.example`.

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

