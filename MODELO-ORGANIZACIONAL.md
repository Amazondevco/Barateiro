# Modelo Organizacional (Hierarquia de Cadastros)

> **Status:** Levantamento (decisões marcadas abaixo). Define a espinha dorsal do sistema.

---

## 1. Hierarquia

```
REDE (cliente / tenant)
 ├─ UNIDADES                         tipo: Loja · CD/Galpão · Escritório/Sede · ...
 │    └─ nome · código · localização (endereço, cidade/UF, geo) · status
 │
 ├─ DEPARTAMENTOS                    têm um ESCOPO:
 │    ├─ escopo UNIDADE  → preso a uma unidade  (ex.: Açougue da Loja 1)
 │    └─ escopo REDE     → geral, sem unidade   (ex.: Administrativo, Compras, RH)
 │
 └─ USUÁRIOS                         papel + vínculos (rede / unidade(s) / departamento(s))
```

> **Sem entidade "Equipe" na V1** — o departamento já agrupa suas pessoas. (Decisão: pode virar entidade depois, se precisar de turnos/grupos nomeados.)

---

## 2. Entidades e campos

### Rede (cliente / tenant)
`nome` · `CNPJ` · `logo` (white-label) · `plano` · `módulos ligados` · `status` · `contato`

### Unidade
`rede_id` · `nome` · `código` · **`tipo`** (Loja | CD/Galpão | Escritório/Sede | ...) · `endereço` · `cidade/UF` · `geo` (opcional) · `status`
> Conceito **genérico com tipo** → serve loja, galpão, escritório e tipos futuros sem reescrever.

### Departamento
`rede_id` · `nome` · **`escopo`** (rede | unidade) · `unidade_id` (nulo quando escopo = rede) · `departamento_modelo_id` (opcional, do catálogo)
> O campo **escopo** resolve os dois casos (geral da rede vs. de uma loja) com um só modelo.

### Catálogo de departamentos (modelo)
Lista padrão (Mercearia, Frios, Hortifrúti, Açougue, Padaria, Frente de Caixa, Pontas de Gôndola, Administrativo, Compras, RH...) que se **instancia/ativa** por unidade — evita recadastrar em cada uma das 7 lojas.

### Usuário
`rede_id` (nulo para Super Admin) · `nome` · `email` · `papel` (super_admin | admin_supermercado | gerente)
**Vínculos (muitos-para-muitos):**
- `usuario_unidades` → um gerente pode cuidar de **várias unidades** (ex.: 2 lojas).
- `usuario_departamentos` → opcional, para escopo mais fino.

---

## 3. Decisões tomadas

- [x] **Equipe:** não vira entidade na V1 — departamento basta.
- [x] **Checklist por tipo de unidade:** ✅ o motor prevê **múltiplos modelos de formulário**, atribuídos por **tipo de unidade** (loja usa o checklist do gerente; CD/galpão pode ter outro). Galpão não tem padaria → outro formulário.
- [x] **Vínculo múltiplo de usuário:** usuário ↔ várias unidades (N:N). **Sem nível "Regional" formal** por enquanto (modelo já permite adicionar depois).

---

## 4. Conexões com o resto do sistema

- **Checklist ↔ tipo de unidade:** cada tipo de unidade aponta para o(s) modelo(s) de formulário aplicáveis.
- **Seção do checklist ↔ departamento (futuro/diferencial):** ligar a seção "Açougue" ao departamento Açougue permite **rotear o problema** (um "Não" no Açougue notifica a equipe do Açougue). Ideia forte para módulo pago.
- **White-label:** logo vive na **Rede**; aparece em todas as unidades daquele tenant.
- **RBAC:** o vínculo `usuario_unidades` define o escopo do que o gerente enxerga (ver `ACESSOS-E-PAGINAS.md`).

---

## 5. Em aberto
- [x] ~~Cadastro de Unidades~~ → **visão dentro de "Clientes (Redes)"** por enquanto.
- [ ] Campos obrigatórios mínimos da Unidade (código? geo? — geo é útil p/ a checagem de presença por GPS).
- [ ] Roteamento seção→departamento entra na V1 ou fica para módulo futuro?
