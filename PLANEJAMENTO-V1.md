# Planejamento — Sistema de Gestão para Rede de Supermercados (V1)

> **Status:** Planejamento / Especificação
> **Versão do documento:** 1.0
> **Data:** 27/06/2026
> **V1:** Gratuita (entrada). Próximos módulos: licença + suporte.

---

## 1. Visão geral

Plataforma **web (PWA) multi-tenant** para gestão operacional de redes de supermercado.

- **V1 (grátis):** Checklist de loja preenchido pelo gerente no celular, com foto, online/offline, e painel de acompanhamento para os sócios/donos.
- **Estratégia:** a V1 entrega valor de graça e prova o sistema. A mesma base vira uma **plataforma de módulos** — cada módulo novo (validade, temperatura, ruptura etc.) é vendido por **licença mensal + suporte**, sem reescrever o sistema.
- **Multi-tenant desde o dia 1:** cada supermercado é uma "Organização" isolada no mesmo sistema. Vender para um novo cliente = criar uma nova organização, não um novo software.
- **White-label por cliente:** cada rede personaliza o **próprio ambiente** — começando pela **logo** (upload self-service em Configurações), que passa a aparecer no app, nos relatórios e nas exportações daquele tenant. Cada cliente só vê/edita a sua identidade; um nunca acessa a do outro.

### Objetivos
1. Entregar a V1 funcional, bonita e simples, com a marca do cliente.
2. Validar o uso real em 1 loja antes de escalar.
3. Deixar a fundação pronta para plugar e cobrar módulos futuros.

### Não-objetivos da V1 (ficam para depois)
- Múltiplos templates de checklist complexos / lógica condicional avançada.
- Faturamento/cobrança automatizada (Stripe etc.).
- App nativo na Play Store.
- Integrações com ERP/PDV do supermercado.

---

## 2. Decisões técnicas

### 2.1 PWA em vez de APK (decidido)
App web instalável no celular. Entrega tudo que foi pedido com **uma única base de código**:

| Requisito | Como o PWA atende |
|---|---|
| Fica "instalado" na tela do celular | Instalável (Add to Home Screen) |
| Fica logado / não desloga | Sessão persistente |
| Salva senha no Chrome/navegador | Login padrão do navegador (autofill/gerenciador de senhas) |
| Foto anexo | Câmera/galeria do celular via web |
| Funciona offline | Service Worker + fila local; sincroniza ao reconectar |
| Sócios no desktop | Mesma base, layout responsivo |

**Benefício de custo:** 1 base de código = menos token para construir e manter, sem burocracia de loja de apps.

### 2.2 Stack recomendada
- **Front-end:** Next.js (React) configurado como PWA.
- **Back-end / Banco / Auth / Storage:** Supabase
  - Postgres com **Row Level Security (RLS)** → isolamento multi-tenant nativo (cada organização só vê seus dados).
  - Auth (login/senha, sessão).
  - Storage para as fotos dos checklists.
  - **Plano gratuito** cobre a V1 → R$0 de infra no início.
- **Hospedagem:** Vercel (plano gratuito no início).

### 2.3 Custo de infraestrutura (V1)
- Supabase free + Vercel free = **R$0/mês** enquanto o volume for baixo.
- Domínio próprio (opcional): ~R$40/ano.

---

## 3. Arquitetura multi-tenant

```
PLATAFORMA (fundação reaproveitável)
├─ Autenticação (login/senha, sessão persistente)
├─ Organizações  (cada supermercado = 1 tenant) ← isola dados via RLS
├─ Lojas         (cada rede tem N lojas)
├─ Usuários      (vinculados a uma organização)
├─ Papéis        (admin, sócio/dono, gerente)
└─ MÓDULOS (ligados/desligados por organização — é onde se cobra)
   ├─ ✅ Checklist de loja        ← V1 (grátis)
   ├─ 💰 Controle de validade/perdas
   ├─ 💰 Temperatura de câmaras/freezers
   ├─ 💰 Ruptura de gôndola / conferência de preço
   ├─ 💰 Recebimento / avaliação de fornecedores
   ├─ 💰 Pesquisa de preço de concorrentes
   ├─ 💰 Abertura/fechamento + limpeza (vigilância sanitária)
   ├─ 💰 Dashboard / BI consolidado
   └─ 💰 Mural / comunicação interna
```

### Papéis de acesso (V1)
- **Admin (você):** cria organizações, lojas, usuários; configura templates de checklist; gerencia tudo.
- **Sócio/Dono:** vê todas as lojas da sua organização, todos os checklists e relatórios. Não preenche checklist.
- **Gerente:** preenche checklist apenas das lojas a que está vinculado. Não vê relatórios consolidados.

---

## 4. Escopo detalhado da V1 — Módulo Checklist

### 4.1 Fluxo do Gerente (celular / PWA)
1. Abre o app (já logado).
2. Seleciona a loja (se tiver mais de uma).
3. Vê o checklist do dia.
4. Para cada item: marca **OK / Não OK / N/A**, escreve observação (opcional) e anexa **foto** (opcional ou obrigatória conforme o item).
5. Envia. Se estiver **offline**, salva localmente e mostra "pendente de envio"; sincroniza sozinho ao reconectar.

### 4.2 Fluxo do Sócio/Dono (desktop)
1. Login.
2. Painel com checklists enviados — **filtros:** loja, gerente, período, status.
3. Abre um checklist e vê respostas + fotos.
4. **Relatórios:** % de conclusão por loja, itens "Não OK" recorrentes, comparativo entre lojas, histórico por período.

### 4.3 Estrutura de um Checklist
- Um **template** (definido por você) com uma lista de **itens**.
- Cada item tem: título, tipo de resposta (OK/Não OK/N/A), se exige foto, se exige observação.
- Itens agrupados por **seção** (ex.: "Açougue", "Hortifruti", "Limpeza", "Frente de caixa").

### 4.4 Modelo de dados (rascunho)
```
organizations  (id, nome, logo, cores, plano)
stores         (id, org_id, nome, endereço)
users          (id, org_id, nome, email, papel)
user_stores    (user_id, store_id)            -- gerente ↔ lojas

checklist_templates (id, org_id, nome)
checklist_sections  (id, template_id, nome, ordem)
checklist_items     (id, section_id, titulo, exige_foto, exige_obs, ordem)

submissions      (id, org_id, store_id, user_id, template_id, data, status)
                 -- status: rascunho | enviado | sincronizado
answers          (id, submission_id, item_id, resposta, observacao)
answer_photos    (id, answer_id, url)
```
> Toda tabela carrega `org_id` e é protegida por RLS → isolamento entre clientes garantido no banco.

---

## 4.5 Regras de negócio (frequência, foto e retenção)

### Marca / identidade visual
- **Cliente:** Super Barateiro — *"A economia do seu dinheiro!"*
- **Cores:** azul como cor principal (texto/carrinho do logo); rosa e cinza como apoio (golfinhos); fundo branco.
- Logo fornecida pelo cliente, aplicada no app e nos materiais.

### Foto obrigatória
- Sempre que um item for marcado **"Não"** (problema), **foto e observação são obrigatórias**. Sem foto, o envio é bloqueado.

### Frequência: 4x por semana em dias fixos (obrigatório)
- O sistema exige **4 preenchimentos por semana** por loja, em **dias fixos**.
- **Dias recomendados:** Segunda · Quarta · Sexta · Sábado (parelho na semana + blinda o fim de semana, que é o pico). Configurável.
- Faltou no dia previsto? Vira **pendência visível** para o sócio (acompanhamento de cumprimento).
- **Horário limite de envio:** até **10h** do dia (checklist de abertura). Enviou depois → marcado como "fora do prazo". Configurável.

### Edição de envio
- O gerente pode **editar o envio até 30 minutos** após enviar. Passado esse tempo, o registro fica **imutável** (preserva a auditoria).

### Notificações (canal: Push)
- Canal da V1: **notificações Push do PWA** (grátis, sem dependência externa).
- Usos: lembrete ao gerente nos dias previstos; aviso ao sócio quando chega um checklist / quando há "Não"; alerta de não-cumprimento da frequência.
- *(WhatsApp/e-mail ficam para evolução futura.)*

### Rede e piloto
- **Super Barateiro tem 7 lojas** hoje.
- **Piloto da V1: 1 loja** (validação real antes de escalar para as 7 e, depois, multi-tenant para outros supermercados).

### Retenção em 2 níveis (refinado)
Separa o que é leve (relatório) do que pesa (foto):

- **Dados estruturados** (respostas, observações, datas, % de conformidade, métricas) → **guardados para sempre**. São bytes; não há custo relevante. **Relatórios e tendências nunca se perdem** (comparar mês atual com anos atrás).
- **Fotos** (o que custa armazenamento):
  1. **Comprimidas no celular** antes do upload (alvo ~150–300KB) — reduz ~10x e ajuda no 4G.
  2. **Retenção de 2 meses** (janela móvel **só da foto**): passou de 60 dias, apaga **apenas a imagem**; o registro do item (NÃO + observação + data) permanece no relatório.
  3. **Crescimento:** quando o volume subir, mover fotos para storage barato (Cloudflare R2 / Backblaze B2 ≈ centavos/GB, sem custo de download) e, se quiser, esticar a retenção.
- Estimativa: Barateiro (7 lojas × 4x/sem, fotos só nos "Não", comprimidas) ≈ **~1 ano cabe em ~1GB** (free do Supabase).
- Implementação: job agendado que apaga **somente arquivos de foto** com mais de 60 dias.

---

## 5. Roadmap de execução

| Fase | Entrega | Observação |
|---|---|---|
| **0. Spec do checklist** | Lista real de itens que o gerente confere | Sem código. Quanto mais claro, menos retrabalho/token. |
| **1. Protótipo clicável** | Mockup das telas (gerente + sócio) | Cliente aprova o visual antes do código. |
| **2. Fundação** | Login + multi-tenant + lojas/usuários | Base reaproveitável para todos os módulos futuros. |
| **3. Módulo Checklist** | Preenchimento + fotos + painel + relatório | Núcleo da V1. |
| **4. PWA + Offline + Marca** | Instalável, funciona offline, cores/logo do cliente | "Cara do cliente". |
| **5. Deploy + piloto** | No ar, testado com 1 loja real | Coleta feedback para ajustes. |

---

## 6. Modelo de negócio (pós-V1)

- **V1 grátis** = porta de entrada e prova de valor.
- **Módulos pagos** = licença mensal por módulo + suporte.
- Como a base é multi-tenant e modular, **entregar um módulo novo a um cliente existente é só ligar uma chave** — custo marginal baixo, margem alta.

### Módulos prioritários para upsell (por impacto em supermercado)
1. **Validade / perdas (vencimentos)** — reduz prejuízo direto; vende sozinho.
2. **Temperatura de câmaras frias / freezers** — compliance ANVISA + evita perda de produto.
3. **Ruptura de gôndola / conferência de preço** — produto faltando = venda perdida.
4. **Recebimento e avaliação de fornecedores.**
5. **Pesquisa de preço de concorrentes.**
6. **Abertura/fechamento + limpeza (vigilância sanitária).**
7. **Dashboard / BI consolidado** para os sócios.
8. **Mural / comunicação interna** matriz ↔ lojas.

---

## 7. Como economizar token na execução

- **Especificar antes de codar** (Fase 0) — evita que eu "adivinhe" e refaça.
- **Reaproveitar a fundação** — cada módulo futuro herda auth/tenant/lojas, sem reescrever.
- **Construir em sessões focadas** por fase, não tudo de uma vez.
- **Aprovar visual no protótipo** antes de implementar telas reais.

---

## 8. Pendências / decisões em aberto

- [x] ~~Conteúdo do checklist~~ → definido (ver `FORMULARIO-CHECKLIST.md`): 7 seções, 55 itens.
- [x] ~~Marca do cliente~~ → **Super Barateiro** (logo recebida; azul/rosa/cinza).
- [x] ~~Foto obrigatória?~~ → **Sim, obrigatória em todo "Não".**
- [x] ~~Retenção de dados~~ → **2 níveis: dados estruturados p/ sempre; fotos comprimidas + 2 meses.**
- [x] ~~Frequência~~ → **4x/semana em dias fixos** (recomendado Seg/Qua/Sex/Sáb, configurável).
- [x] ~~Quantas lojas~~ → **7 lojas**; piloto em **1 loja**.
- [x] ~~Horário limite~~ → **até 10h** (configurável); depois = "fora do prazo".
- [x] ~~Edição de envio~~ → **permitida até 30 min após o envio**; depois imutável.
- [x] ~~Canal de notificação~~ → **Push (PWA)** na V1.
- [x] ~~Lojas/Unidades no menu~~ → **visão dentro do Cliente (Redes)**, não página separada (por enquanto).
```
