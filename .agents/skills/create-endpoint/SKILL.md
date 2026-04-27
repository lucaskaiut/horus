---
name: create-endpoint
description: Playbook para criar endpoints na aplicação Laravel deste repositório. Use quando o usuário pedir para criar um endpoint/rota (e.g. POST /api/...), controller, request, service, resource, testes automatizados e documentação OpenAPI (api/public/openapi.yaml).
metadata:
  author: Lucas Kaiut
---

# Create Endpoint (Laravel)

## Quando usar
Use este guia quando o usuário pedir para:
- criar **endpoint**, **rota**, **controller**, **request**, **service**, **resource**
- adicionar **teste** (feature/unit) para o endpoint
- documentar no **OpenAPI** em `api/public/openapi.yaml`

## Padrão de responsabilidades (camadas)
- **Request (FormRequest)**: validação/normalização de entrada (campos obrigatórios, tipos, regras).
- **Controller**: orquestração (recebe Request validado, chama Service, retorna Response/Resource). Evitar regra de negócio aqui.
- **Service (Domain)**: regra de negócio e integrações (ex: chamadas HTTP externas), retorna dados “puros” (array/DTO).
- **Resource (JsonResource)**: transforma o resultado do Service para o contrato público da API (ex: filtrar campos).
- **Routes**: mapear rota → controller. Para API, usar `api/routes/api.php` (prefixo `/api` já é aplicado pelo Laravel).
- **Testes**: devem mockar integrações externas (ex: `Http::fake`) e validar status + shape do JSON.
- **OpenAPI**: documentar request/response do endpoint criado.

## Convenções específicas deste repositório
- **Backend** fica em `api/`.
- **Rotas de API** ficam em `api/routes/api.php` e viram endpoints reais em `/api/...`.
- **Documentação OpenAPI** fica em `api/public/openapi.yaml`.
- **Testes** ficam em `api/tests/Feature` (endpoint) e `api/tests/Unit` (unidades puras).
- Se o endpoint precisa de módulos por domínio, use estrutura como:
  - `api/app/Modules/<Modulo>/Http/Requests`
  - `api/app/Modules/<Modulo>/Http/Controllers`
  - `api/app/Modules/<Modulo>/Http/Resources`
  - `api/app/Modules/<Modulo>/Domain/Services`

## Checklist (workflow recomendado)
1. **Definir contrato do endpoint**
   - método e path (ex: `POST /api/foo`)
   - request JSON (campos obrigatórios/opcionais)
   - response JSON (status HTTP e campos)
   - erros esperados (ex: 422 validação, 401/403 auth se aplicável)

2. **Criar Request**
   - Criar `FormRequest` com `rules()` e `authorize()`.
   - Preferir `nullable` para opcionais; validar tipo/formatos.

3. **Criar Service**
   - Colocar integração/regra de negócio aqui.
   - Se houver HTTP externo: usar `Http::timeout(...)->asJson()->acceptJson()->post(...)->throw()`.
   - Usar `config('services.<algo>.<chave>')` + env (ex: `AUTH_SERVER_URL`) em vez de hardcode.

4. **Criar Resource**
   - Retornar somente os campos que a API deve expor.
   - Garantir tipos (cast para string/int quando necessário).

5. **Criar Controller**
   - Receber `FormRequest`, usar `$request->validated()`.
   - Chamar Service.
   - Retornar resposta no formato combinado (ex: `response()->json(['data' => $resource], 201)`).

6. **Criar rota em `routes/api.php`**
   - Exemplo: `Route::post('/foo', FooController::class.'@store');`
   - Lembrar: a URL real vira `/api/foo`.

7. **Criar testes**
   - Para endpoint: criar `api/tests/Feature/<Modulo>/<Endpoint>Test.php`.
   - Mockar integrações externas:
     - HTTP: `Http::fake([...])` e `Http::assertSent(...)`
   - Validar:
     - status (`assertOk`, `assertCreated`, etc.)
     - JSON shape e campos retornados
     - validação 422 para payload inválido (pelo menos 1 caso)

8. **Documentar OpenAPI**
   - Atualizar `api/public/openapi.yaml`:
     - `paths: /api/<endpoint>` (não esquecer o prefixo `/api`)
     - `requestBody` com schema e required
     - `responses` com status e schema

9. **Rodar testes**
   - Executar: `docker compose exec api php artisan test`
   - Só concluir quando estiver verde.

## Template rápido (exemplo)
Supondo endpoint `POST /api/foo`:
- Route: `api/routes/api.php`
- Request: `api/app/Modules/Foo/Http/Requests/FooRequest.php`
- Controller: `api/app/Modules/Foo/Http/Controllers/FooController.php`
- Service: `api/app/Modules/Foo/Domain/Services/FooService.php`
- Resource: `api/app/Modules/Foo/Http/Resources/FooResource.php`
- Test: `api/tests/Feature/Foo/FooTest.php`
- OpenAPI: `api/public/openapi.yaml` em `paths: /api/foo`

## Padrões de teste (HTTP externo)
Quando o Service chama servidor externo via `Http::...`:
- Use `Http::fake()` para retornar a resposta desejada.
- Garanta que o request foi enviado com o payload correto via `Http::assertSent()`.

## Observações
- Evite lógica de negócio no controller.
- Nunca exponha campos “extras” do servidor externo: filtre no Resource.
- Prefira `config/services.php` para credenciais/URLs e variáveis de ambiente no `.env`/`.env.example`.
