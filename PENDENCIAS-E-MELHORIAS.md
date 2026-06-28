# Pendências, Pontas Soltas e Melhorias

> **Status:** Varredura de gaps do levantamento. Marcações: 🔴 crítico p/ V1 · 🟡 recomendado · 🟢 futuro/módulo.

---

## A. Pontas soltas já anotadas (decisões pequenas)
- [x] ~~Horário limite~~ → **até 10h** (configurável); depois = "fora do prazo".
- [x] ~~Lojas/Unidades no menu~~ → **visão dentro de "Clientes (Redes)"** por enquanto.
- [x] ~~Edição de envio~~ → **até 30 min após o envio**; depois imutável.
- [x] ~~Canal de notificação~~ → **Push (PWA)** na V1.
- [ ] Campos obrigatórios mínimos da Unidade (código? geo? — geo ajuda no GPS).
- [ ] Padaria item 5 ("olhar 2x ao dia") → permite 2 envios no mesmo dia?
- [ ] Roteamento seção→departamento entra na V1 ou vira módulo?
- [ ] Visão do Admin do supermercado p/ gerenciar as próprias Unidades (não vê "Clientes").

---

## B. Áreas que ainda NÃO tocamos (gaps)

### B1. 🔴 Autenticação completa
Temos "login/senha", mas falta o ciclo todo:
- Como o usuário é **criado** (convite por e-mail? admin cadastra e define senha?).
- **Primeiro acesso** (definir senha).
- **"Esqueci minha senha"** (recuperação).
- Login por **e-mail** (como no print SASI) ou usuário?
- Sessão longa no celular + "salvar senha" no navegador (já planejado).

### B2. 🔴 Notificações e lembretes
Sem isso, a regra de "4x/semana" é passiva. Precisa:
- **Lembrete ao gerente** nos dias previstos (Seg/Qua/Sex/Sáb).
- **Aviso ao sócio** quando um checklist chega (ou só resumo diário).
- **Alerta de não-cumprimento** quando o gerente não preencheu no dia.
- ✅ **Canal decidido: Push do PWA** na V1 (grátis, sem dependência externa). WhatsApp/e-mail = evolução futura.

### B3. ✅ Retenção × histórico de longo prazo — DECIDIDO
Política em 2 níveis:
- **Dados estruturados (relatórios/métricas) → para sempre** (são bytes; relatórios nunca se perdem).
- **Fotos → comprimidas no celular + retenção de 2 meses (só a imagem) + storage barato (R2/Backblaze) quando crescer.**
- Apagar a foto **não** apaga o registro do item (NÃO + obs + data continuam no relatório).

### B4. 🟡 Tratativa do "Não" (plano de ação)
Hoje o "Não" só gera registro. Melhoria de alto valor:
- Sócio/admin marca o problema como **em tratativa / resolvido**, com responsável e prazo.
- Vira um mini **plano de ação** — transforma o checklist em ferramenta de gestão, não só de coleta.
- Forte candidato a **diferencial / módulo pago**.

### B5. 🟡 Confirmação de presença (anti-fraude)
Garantir que o gerente preencheu **na loja**, não de casa:
- **Geolocalização** no envio (compara com a localização da unidade), e/ou
- Foto sempre com carimbo de data/hora/dispositivo.

### B6. 🔴 Fotos: compressão e limites
Crítico para custo (Supabase free ≈ 1GB) e para dados móveis:
- **Comprimir a imagem no celular** antes de subir.
- Limite de tamanho/quantidade por item.
- (A retenção de 2 meses ajuda a não acumular.)

### B7. 🔴 LGPD / privacidade
- Fotos da loja + nomes de funcionários = dados pessoais.
- Política de privacidade, base legal, e o ciclo de retenção/descarte (já temos os 2 meses, que ajuda).
- Consentimento/termos no primeiro acesso.

### B8. 🟡 White-label além da logo
- Permitir **cor primária por tenant** (Barateiro = azul; SASI = índigo).
- Nome do ambiente, favicon.

### B9. ✅ Edição/correção de um envio — DECIDIDO
- Gerente pode **editar até 30 minutos após o envio**. Depois vira **imutável** (preserva auditoria).

### B10. 🟢 Onboarding de cliente e planos
- Como uma nova rede entra (Super Admin cria na V1; self-signup depois).
- Limites por plano (nº de unidades/usuários, módulos).

### B11. 🟢 Modo demonstração
- Ambiente com dados fictícios para **vender** o sistema a prospects.

### B12. 🟢 Telemetria de produto
- Medir uso real (quais telas, adesão dos gerentes) para evoluir.

---

## C. Resumo de prioridade

| # | Item | Prioridade |
|---|---|---|
| B1 | Autenticação completa | 🔴 V1 |
| B3 | Retenção + métricas agregadas | 🔴 V1 (afeta o banco) |
| B6 | Compressão/limite de fotos | 🔴 V1 |
| B7 | LGPD básico | 🔴 V1 |
| B2 | Notificações/lembretes | ✅ **V1** |
| B4 | Tratativa do "Não" | ✅ **V1** |
| B5 | Presença/anti-fraude (GPS) | ✅ **V1** |
| B8 | Cor por tenant | ✅ **V1** |
| B9 | Edição de envio | 🟡 |
| B10–B12 | Onboarding/planos, demo, telemetria | 🟢 futuro |
