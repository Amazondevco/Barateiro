# Níveis de Acesso e Páginas (RBAC + Menu)

> **Status:** Levantamento. Abordagem: construir tudo na visão **Super Admin** primeiro; depois recortar as visualizações de cada papel dentro das mesmas páginas.

---

## 1. Três níveis de acesso

| Nível | Quem é | Enxerga |
|---|---|---|
| **Super Admin** | SASI (você) | **Tudo, de todos os clientes** (todas as redes, todas as lojas) |
| **Admin do supermercado** | Dono + sócios da rede | **Tudo da própria rede** (suas lojas, usuários, relatórios) |
| **Gerente** | Gerente de loja | **Só o que lhe compete** (preencher checklist da(s) sua(s) loja(s)) |

Regra de ouro: cada nível só "enxerga para baixo" e dentro do seu escopo. O Admin do supermercado **nunca** vê outra rede; o gerente **nunca** vê dados de gestão/usuários.

---

## 2. Páginas do Super Admin (menu — FECHADO)

Menu final (ordem do menu lateral):

1. **Visão geral** — dashboard (no Super Admin: agregado de todos os clientes).
2. **Clientes (Redes)** — gestão dos supermercados-clientes: criar, ativar/desativar, plano, **módulos ligados**, logo, status. *É aqui que o Super Admin "abre" um novo cliente.* **As Unidades/Lojas são geridas como uma visão dentro do Cliente** (aba/seção no detalhe da rede), não como página separada (por enquanto).
3. **Formulários** — modelos de checklist (seções, itens, biblioteca de itens reutilizáveis) + respostas recebidas. **O gerente preenche aqui** (modo "preencher" da mesma página).
4. **Usuários** — todos os usuários, papéis e vínculos (loja/rede).
5. **Relatórios** — consolidados: conformidade, pendências, comparativo entre lojas/redes.
6. **Faturamento / Licenças** — cobrança por cliente e por módulo (licença + suporte).
7. **Auditoria / Logs** — quem fez o quê (criou, editou, apagou); rastreabilidade entre clientes.
8. **Suporte / Sugestões** — canal de suporte e caixa de sugestões (padrão SASI).
9. **Configurações** — do sistema (Super Admin) e da conta (logo, dias da frequência, retenção, etc.).

> **Nota de acesso:** como o **Admin do supermercado não vê "Clientes (Redes)"**, a gestão das Unidades dele precisará aparecer em outro lugar na visão dele (ex.: dentro de Configurações ou uma página "Unidades" própria do tenant). Revisitar ao detalhar a visão do Admin.

---

## 3. Como cada página aparece por papel (recorte)

| Página | Super Admin | Admin do supermercado | Gerente |
|---|---|---|---|
| Visão geral | Global (todos os clientes) | Só a sua rede | Só dele / sua loja |
| Clientes (Redes) | ✅ Total (inclui Unidades/Lojas como visão interna) | ❌ (não vê) | ❌ |
| Unidades/Lojas | Dentro do Cliente (todas) | As da sua rede (ver nota de acesso) | A(s) sua(s) — leitura |
| Formulários | Cria/edita modelos (global) | Usa; ajustes da rede | **Preenche** (sem editar modelo) |
| Usuários | Todos | Os da sua rede | ❌ |
| Relatórios | Global + por cliente | Da sua rede | ❌ (ou só os próprios envios) |
| Faturamento / Licenças | ✅ Total | Só a própria fatura (ver) | ❌ |
| Auditoria / Logs | Global | Da sua rede | ❌ |
| Suporte / Sugestões | Vê/responde tudo | Abre/visualiza os seus | Abre os seus |
| Configurações | Sistema + conta | Da rede (logo, dias, etc.) | ❌ |

> O **Gerente** essencialmente vive em: **Visão geral simplificada** + **Formulários (preencher)** + histórico dos próprios envios.

---

## 4. Abordagem de construção

1. Construir cada página na **visão Super Admin** (o superconjunto).
2. Aplicar **RBAC** por papel: cada papel é um **recorte/filtro** da mesma página (menos itens de menu, dados limitados ao escopo, ações restritas).
3. Isso evita reescrever telas — uma base, três visões.

---

## 5. Decisões e em aberto
- [x] ~~Páginas opcionais~~ → **incluídas todas**: Auditoria/Logs, Faturamento/Licenças, Suporte/Sugestões.
- [x] ~~Gerente: Formulários ou Checklists?~~ → **dentro de "Formulários"** (modo preencher; menu igual entre papéis).
- [x] ~~Onde fica o cadastro de Lojas/Unidades?~~ → **visão dentro do Cliente (Redes)** por enquanto (não é página separada).
- [ ] Visão do **Admin do supermercado**: onde ele gerencia as próprias Unidades (já que não vê "Clientes")? Revisitar.
