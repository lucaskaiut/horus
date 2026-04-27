# Especificação Técnica — Serviço Interno de Logs

---

# 1. Objetivo

Desenvolver um serviço interno centralizado para registro, consulta e análise de logs de múltiplas aplicações.

O serviço deverá suportar:

* Recebimento de logs via API.
* Autenticação por Bearer Token validada em servidor externo.
* Salvamento assíncrono via filas.
* Consulta rápida com filtros.
* Painel web em React + Tailwind CSS.
* Estrutura preparada para alto volume de dados.
* Associação de logs com entidades externas usando `entity_name` e `entity_id`.

---

# 2. Escopo do Serviço

## 2.1 Responsabilidades

O serviço será responsável por:

* Receber logs estruturados via API.
* Validar autenticação via servidor externo.
* Publicar logs em fila para processamento assíncrono.
* Persistir logs em um mecanismo otimizado para busca.
* Permitir consulta com filtros avançados.
* Exibir logs em painel web.
* Permitir rastreabilidade por entidade, request, trace e tracking.

## 2.2 Fora do Escopo Inicial

* Gerenciamento de usuários local.
* Sistema completo de alertas.
* Substituição de ferramentas como ELK completo.
* Processamento síncrono obrigatório.
* Correlação avançada distribuída (além de `trace_id` básico).

---

# 3. Arquitetura Geral

```txt
Aplicações de origem
        |
        | HTTP + Bearer Token
        v
API de Logs
        |
        | Valida token externo
        v
Servidor de Autenticação

API de Logs
        |
        | Publica evento na fila
        v
Fila de Logs
        |
        | Worker consome
        v
OpenSearch

Painel Web React + Tailwind CSS
        |
        | Consulta API
        v
API de Logs
        |
        | Busca logs
        v
OpenSearch
```

---

# 4. Componentes

## 4.1 API de Logs

Responsável por:

* Receber logs.
* Validar token via API externa.
* Validar payload.
* Gerar `tracking_id`.
* Publicar mensagem na fila.
* Expor endpoints de consulta.
* Aplicar filtros e paginação.
* Validar escopos.

---

## 4.2 Fila de Logs

Responsável por desacoplar ingestão de persistência.

Sugestão inicial:

```txt
Redis Queue
```

Alternativas para evolução:

```txt
RabbitMQ
Kafka
```

---

## 4.3 Worker de Logs

Responsável por:

* Consumir logs da fila.
* Normalizar payload.
* Mascarar dados sensíveis.
* Indexar no OpenSearch.
* Reprocessar falhas.
* Enviar logs inválidos para fila de erro.

---

## 4.4 Storage de Logs

O storage principal será:

```txt
OpenSearch
```

Responsável por:

* Armazenar logs como documentos.
* Indexar campos pesquisáveis.
* Executar queries rápidas.
* Permitir busca textual e filtragem eficiente.

**Não utilizar banco relacional para armazenamento de logs.**

---

## 4.5 Painel Web

Stack:

```txt
React
Tailwind CSS
```

Responsável por:

* Listagem de logs.
* Filtros avançados.
* Visualização detalhada.
* Consulta rápida.
* Investigação técnica.

---

# 5. Autenticação

## 5.1 Tipo

```http
Authorization: Bearer {token}
```

## 5.2 Fluxo

1. API recebe requisição.
2. Extrai token.
3. Consulta servidor de autenticação.
4. Valida resposta.
5. Continua ou rejeita requisição.

## 5.3 Configuração

```env
AUTH_SERVER_URL=https://auth.internal/api/token/validate
AUTH_SERVER_TIMEOUT=5
```

## 5.4 Resposta esperada

```json
{
  "valid": true,
  "client": {
    "id": "api",
    "name": "API"
  },
  "scopes": ["logs:create"]
}
```

---

# 6. Escopos

```txt
logs:create
logs:read
logs:delete
logs:admin
logs:failed:read
logs:failed:retry
logs:failed:discard
```

---

# 7. Salvamento Assíncrono

## 7.1 Fluxo

```txt
1. POST /api/logs
2. API valida token
3. API valida payload
4. API gera tracking_id
5. API envia para fila
6. API retorna 202
7. Worker consome
8. Worker indexa no OpenSearch
```

## 7.2 Resposta

```http
202 Accepted
```

```json
{
  "message": "Log recebido para processamento",
  "tracking_id": "01HXABC123"
}
```

---

## 7.3 Fila de erro

```txt
logs:failed
```

Deve conter:

```txt
tracking_id
payload
erro
tentativas
timestamp
```

---

# 8. Modelo de Dados (Documento)

Estrutura armazenada no OpenSearch:

```json
{
  "tracking_id": "string",
  "level": "string",
  "message": "string",
  "message_search": "string",
  "context": {},
  "entity_name": "string",
  "entity_id": "string",
  "source": "string",
  "environment": "string",
  "channel": "string",
  "request_id": "string",
  "trace_id": "string",
  "user_id": "string",
  "ip_address": "string",
  "user_agent": "string",
  "exception": {
    "class": "string",
    "message": "string",
    "file": "string",
    "line": 0,
    "stack_trace": "string"
  },
  "received_at": "date",
  "processed_at": "date",
  "created_at": "date"
}
```

---

# 9. Estratégia para Alto Volume

## 9.1 Escrita

* Uso de fila
* Workers paralelos
* Retry automático
* Dead letter queue
* Batch opcional
* Limite de payload
* Compressão de stack trace

---

## 9.2 Leitura

Consultas no OpenSearch devem usar:

```txt
range query (created_at)
term query (campos exatos)
match query (texto)
bool query (combinação)
search_after (cursor)
sort por created_at desc
```

## 9.3 Regra obrigatória

Toda consulta deve exigir filtro de período.

---

# 10. Estratégia de Índices

## 10.1 Índices por período

Mensal:

```txt
logs-production-2026.04
```

Diário (alto volume):

```txt
logs-production-2026.04.27
```

---

## 10.2 Mapeamento

### Keyword

```txt
tracking_id
level
source
environment
channel
entity_name
entity_id
request_id
trace_id
user_id
```

### Text

```txt
message
exception.message
stack_trace
```

### Date

```txt
created_at
received_at
processed_at
```

### Object / Flattened

```txt
context
exception
```

---

# 11. Retenção

Sugestão:

```txt
local: 7 dias
staging: 30 dias
production: 90 dias
errors críticos: 180 dias
```

Implementado via exclusão de índices.

---

# 12. API

## 12.1 Criar log

```http
POST /api/logs
```

Retorno:

```http
202 Accepted
```

---

## 12.2 Listar logs

```http
GET /api/logs
```

Filtros:

```txt
level
source
environment
channel
entity_name
entity_id
request_id
trace_id
tracking_id
user_id
search
created_from
created_to
cursor
limit
```

---

## 12.3 Detalhar

```http
GET /api/logs/{id}
```

---

## 12.4 Tracking

```http
GET /api/logs/tracking/{tracking_id}
```

---

# 13. Painel Web

## 13.1 Telas

### Listagem

* Filtro por período
* Filtro por nível
* Filtro por source
* Filtro por ambiente
* Busca textual
* Paginação por cursor

### Detalhe

* Mensagem completa
* JSON formatado
* Stack trace
* Dados da entidade
* IDs de rastreamento

### Falhas

* Logs com erro
* Tentativas
* Reprocessamento

---

# 14. UX

* Filtro obrigatório por período
* Auto refresh opcional
* JSON formatado
* Stack trace colapsável
* Copiar IDs
* Loading claro
* Empty state
* Erro claro

---

# 15. Segurança

* Bearer Token obrigatório
* Validação externa
* Rate limit
* Limite de payload
* Mascaramento de dados sensíveis

Campos sensíveis:

```txt
password
token
authorization
card_number
cvv
secret
api_key
```

---

# 16. Observabilidade

Endpoints:

```http
GET /health
GET /api/health
```

Monitorar:

* Tamanho da fila
* Throughput
* Falhas
* Latência
* Tempo de query

---

# 17. Critérios de Aceite

* API retorna 202
* Logs entram na fila
* Worker processa logs
* Logs indexados no OpenSearch
* Falhas vão para fila de erro
* Autenticação externa funcionando
* Escopos respeitados
* Filtros rápidos
* Consulta exige período
* Painel funcional
* Testes automatizados
* Documentação pronta

---

# 18. Decisão Final de Arquitetura

Arquitetura definida:

```txt
API Backend
Redis Queue
Worker paralelo
OpenSearch como storage principal
React + Tailwind no painel
Autenticação externa
```

Essa estrutura garante:

* Alta performance
* Baixo acoplamento
* Escalabilidade horizontal
* Resposta rápida em consultas
* Preparação para grande volume de dados

---
