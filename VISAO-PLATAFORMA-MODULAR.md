# Visão de Plataforma Modular (ERP de Supermercado) — Norte de Longo Prazo

> **Status:** Brainstorm / visão futura. **NÃO é escopo da V1.** Serve para garantir que a V1 seja construída de um jeito que **não bloqueie** este futuro.
> Objetivo: um **ERP completo e integrado** para redes de supermercado, onde cada capacidade é um **módulo** com **API própria, chave e contrato**.

---

## 1. Princípio que protege o futuro (decisão de hoje)

Mesmo a V1 sendo só o **checklist (módulo Operacional)**, ela deve nascer:
- **API-first:** a tela consome uma API; a API não é "apêndice" da tela.
- **Modular:** o checklist é o **primeiro módulo**, não "o sistema". A fundação (auth, tenant, RBAC, faturamento) é compartilhada; módulos plugam nela.
- **Multi-tenant + entitlements:** cada cliente tem módulos **ligados/desligados** (já previsto em Faturamento/Licenças).

> Custo disso na V1 é baixo; o custo de **não** fazer é reescrever tudo depois. É o seguro mais barato do projeto.

---

## 2. Catálogo de módulos (visão)

| Módulo | O que faz | Quando |
|---|---|---|
| **Operacional** | Checklist/auditoria de loja, tarefas, presença | **V1** |
| **Estoque** | Inventário, movimentações, validade/perdas, curva ABC | Futuro |
| **Compras** | Pedidos, cotação, fornecedores, recebimento | Futuro |
| **Fiscal** | NF-e / NFC-e / SAT, escrituração, SPED Fiscal/EFD | Futuro (regulado) |
| **Contábil** | Plano de contas, lançamentos, SPED ECD/ECF, DRE/Balanço | Futuro (regulado) |
| **Financeiro** | Contas a pagar/receber, fluxo de caixa, conciliação bancária | Futuro |
| **Precificação/Promoções** | Preços, margens, encartes, ofertas | Futuro |
| **BI / Relatórios** | Consolidado entre módulos e lojas | Futuro |
| **PDV / Vendas** | Integração com frente de caixa | Futuro/integração |

> Cada módulo = uma unidade de **venda** (licença + suporte) e uma unidade de **API**.

---

## 3. Arquitetura de API e integração

### 3.1 API por módulo, versionada
- Cada módulo expõe sua própria API REST **versionada** (`/v1/fiscal/...`, `/v1/estoque/...`).
- Política de versão e **deprecação** (v1 → v2 sem quebrar quem integrou).

### 3.2 Chave de API por módulo + escopos (least privilege)
- Uma **chave** é vinculada a: **tenant + módulo + escopos** (ex.: `estoque:read`, `compras:write`).
- A chave **só funciona nos módulos que o tenant tem habilitados** (liga com entitlements/faturamento).
- **Sandbox vs Produção:** chaves separadas para teste e produção.

### 3.3 Contratos (o "não dá pra fazer qualquer coisa")
- O **contrato é um OpenAPI 3** por módulo: define exatamente endpoints, campos, tipos, erros.
- **Validação de contrato** na entrada (request inválido é rejeitado) e **contract testing** automatizado.
- Guardrails: **escopos**, **rate limiting**, **idempotency keys** (evita duplicidade), **assinatura/HMAC** de requests, **IP allowlist** opcional, e **log de auditoria** de toda chamada.

### 3.4 Dados-mestre compartilhados (master data)
- Entidades centrais (Lojas/Unidades, Produtos, Fornecedores, Usuários) vivem na **fundação** e são consumidas pelos módulos — sem duplicar.
- Integração entre módulos por **eventos** (padrão outbox / fila): ex.: "NF-e recebida" → atualiza Estoque → reflete em Compras.

### 3.5 Webhooks (integração de saída)
- Eventos enviados para sistemas externos do cliente (ex.: `nfe.emitida`, `estoque.ruptura`), com **assinatura** e reentrega.

### 3.6 Documentação de integração (developer portal)
- **Swagger/OpenAPI navegável** + guias de autenticação + **coleção Postman** + changelog + status page.
- É o que torna o sistema "integrável" por terceiros e por outros sistemas seus.

---

## 4. ⚠️ Alerta importante: Fiscal e Contábil são regulados

Fiscal/Contábil no Brasil são **pesados e mudam direto** (SEFAZ, certificado digital A1/A3, regimes tributários, ICMS/ST/PIS/COFINS, layouts SPED).

**Recomendação:** **não construir o motor fiscal do zero.** Integrar provedores especializados (ex.: PlugNotas/Tecnospeed, Focus NFe, NFe.io, eNotas) para emissão/escrituração, e **construir por cima a camada de gestão/relatórios**. Isso reduz risco regulatório e tempo de entrega — e o módulo ainda é seu para vender.

---

## 5. Como conecta com o que já está planejado
- **Faturamento/Licenças** (menu já previsto) = onde se liga/desliga módulo por tenant e se controla a chave de API.
- **RBAC** já existe; some-se escopos de API.
- **Multi-tenant/RLS** já é a base do isolamento, inclusive das chaves.
- **Auditoria/Logs** (menu já previsto) cobre também o log de chamadas de API.

---

## 6. Em aberto (decisões futuras — não bloqueiam a V1)
- [ ] REST vs GraphQL para a API pública (recomendo REST + OpenAPI por simplicidade de contrato).
- [ ] Fiscal/Contábil: integrar provedor (recomendado) vs construir.
- [ ] Barramento de eventos: começar simples (outbox no Postgres) e evoluir.
- [ ] Portal do desenvolvedor: quando lançar (após o 2º módulo, provavelmente).
- [ ] Modelo de cobrança da API (por módulo? por volume de chamadas?).

---

## 7. Resumo da decisão de hoje
Construir a **V1 API-first e modular**. Nenhum módulo novo precisa de reescrita — só "pluga" na fundação. A visão de ERP completo fica registrada como **norte**; o foco de execução continua sendo o **módulo Operacional (checklist)**.
