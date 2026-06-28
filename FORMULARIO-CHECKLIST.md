# Especificação do Formulário — Checklist Diário do Gerente

> Base: PDF "Checklist Diário do Gerente por Seção" (Pedro Della Nora / Fórmula do Lucro).
> Aqui o formulário de papel é redesenhado como **formulário digital inteligente**, com condicionais.

---

## 1. Princípio: o sistema já sabe quem, quando e onde

No papel existem **Data** e **Assinatura**. Num sistema com login, isso é redundante e some do formulário — vem automático:

| Campo do papel | No sistema (automático) |
|---|---|
| Data | Carimbo de data/hora do envio (preenchimento e envio) |
| Assinatura | Identidade do usuário logado (nome, cargo) = assinatura digital |
| Nome / quem preencheu | Vem do cadastro do usuário |
| Loja | Vem do vínculo do usuário (ou seleção, se ele cuida de + de 1 loja) |

➡️ O gerente **abre e já começa a responder**. Zero digitação de dados que o sistema tem.

---

## 2. Tipos de campo (motor do formulário)

| Tipo | Uso | Estado "problema" |
|---|---|---|
| `sim_nao` | Maioria dos itens | resposta = **Não** |
| `opcoes` | Item com opções próprias (ex.: Abastecido / Com ruptura) | opção marcada como negativa |
| `numero` | Temperatura (°C) | valor **fora da faixa** configurada |
| `na` (modificador) | Item/seção que não se aplica àquela loja | — (não conta no score) |

---

## 3. Lógica condicional inteligente (o coração)

**Regra geral:** o campo de **Observação** e o de **Foto** só aparecem quando há problema. Enquanto está tudo OK, a tela fica limpa e o gerente avança rápido.

```
SE resposta = OK (Sim / Abastecido):
    → não pede nada, segue para o próximo item.

SE resposta = PROBLEMA (Não / Com ruptura):
    → ABRE "Observação"  (OBRIGATÓRIA)
    → ABRE "Foto"        (OBRIGATÓRIA — sem foto, não envia)
```

> **Decisão do cliente:** foto é **obrigatória em todo "Não"**. O gerente não consegue finalizar o item-problema sem anexar a foto de evidência. (Os marcadores 🟡/⚪ da tabela abaixo viram referência de prioridade, mas a regra ativa é: todo "Não" exige foto.)

**Por quê:** a observação e a foto só têm valor quando algo está errado — é a evidência que o sócio precisa ver. Em dia normal (tudo OK), o gerente não perde tempo.

### Recursos que deixam o uso diário rápido
1. **Botão "Tudo certo nesta seção"** → marca todos os itens como OK; o gerente só vira a chave nas exceções.
2. **Barra de progresso** (ex.: 32/55) + **% de conformidade** automático.
3. **Resumo de pendências:** ao enviar, o sistema lista só os "Não" com foto/obs → é isso que o sócio recebe primeiro.
4. **N/A:** loja sem padaria? Marca a seção como "Não se aplica" e ela sai do cálculo.
5. **Offline-first:** responde sem internet; fotos e respostas entram numa fila e sincronizam ao reconectar.

---

## 4. Temperatura: Sim/Não na V1 (igual ao PDF)

Decisão do cliente: os itens de temperatura ficam **exatamente como no papel** — resposta **Sim/Não**:

- Frios e Laticínios → item 3 (temperatura do balcão)
- Açougue → item 7 (temperatura das câmaras frias)

> **Ideia para o futuro (não entra na V1):** transformar esses itens em campo numérico (°C) com faixa aceitável e alerta automático. Isso vira a semente do **módulo pago "Temperatura de câmaras"**, sem mexer no resto do sistema.

---

## 5. Formulário completo digitalizado (7 seções · 55 itens)

> Legenda — **Tipo**: tipo de campo · **Foto no "Não"**: 🔴 obrigatória · 🟡 opcional · ⚪ não pede.
> Em todos os itens `sim_nao`, **Observação é obrigatória quando "Não"**.

### 🛒 Seção 1 — MERCEARIA
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | A loja está abrindo abastecida? | sim_nao | 🔴 |
| 2 | Está sendo feito o PVPS? | sim_nao | 🟡 |
| 3 | As seções estão limpas? | sim_nao | 🔴 |
| 4 | Produtos A+ estão expostos? | sim_nao | 🔴 |
| 5 | Os produtos estão com etiquetas de preços? | sim_nao | 🔴 |
| 6 | Foram retiradas as etiquetas de preço das ofertas do dia anterior? | sim_nao | 🟡 |
| 7 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |

### 🧀 Seção 2 — FRIOS E LATICÍNIOS
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | Expositores estão abastecidos? | sim_nao | 🔴 |
| 2 | Está sendo feito o PVPS? | sim_nao | 🟡 |
| 3 | A temperatura do balcão está ok? | sim_nao | 🟡 |
| 4 | Os expositores estão limpos? | sim_nao | 🔴 |
| 5 | Os produtos estão com etiquetas de preços? | sim_nao | 🔴 |
| 6 | Foram retiradas as etiquetas de preço das ofertas do dia anterior? | sim_nao | 🟡 |
| 7 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |
| 8 | Foi verificada a validade dos itens? | sim_nao | 🔴 |

### 🥬 Seção 3 — HORTIFRÚTI
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | As frutas estão bem expostas? | sim_nao | 🔴 |
| 2 | Na abertura, o hortifrúti está: | **opcoes**: Abastecido / **Com ruptura** | 🔴 (se ruptura) |
| 3 | Foram retirados os produtos estragados? | sim_nao | 🔴 |
| 4 | O jogo de cores está ok? | sim_nao | 🟡 |
| 5 | Os produtos estão com etiquetas de preços? | sim_nao | 🔴 |
| 6 | Foram retiradas as etiquetas de preço das ofertas do dia anterior? | sim_nao | 🟡 |
| 7 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |
| 8 | Estão disponíveis embalagens? | sim_nao | 🟡 |

### 🥩 Seção 4 — AÇOUGUE
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | O balcão de carnes está abrindo abastecido? | sim_nao | 🔴 |
| 2 | Está havendo controle das perdas? | sim_nao | ⚪ |
| 3 | Estou fazendo o acompanhamento da margem? | sim_nao | ⚪ |
| 4 | Sei qual é o layout que mais vende? (ABC) | sim_nao | ⚪ |
| 5 | A limpeza está ok? | sim_nao | 🔴 |
| 6 | Uniformes e equipamentos de proteção ok? | sim_nao | 🔴 |
| 7 | Temperatura das câmaras frias ok? | sim_nao | 🟡 |
| 8 | Foram retiradas as etiquetas de preço das ofertas do dia anterior? | sim_nao | 🟡 |
| 9 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |

### 🥖 Seção 5 — PADARIA
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | Produtos de alto giro ok? | sim_nao | 🔴 |
| 2 | Tem pão francês no momento da abertura? | sim_nao | 🔴 |
| 3 | Limpeza de balcão ok? | sim_nao | 🔴 |
| 4 | Colaboradores uniformizados adequadamente? | sim_nao | 🔴 |
| 5 | Tem produtos curva A+ nos horários de pico? (olhar 2x ao dia) | sim_nao | 🟡 |
| 6 | Acompanhamento de produtos p/ promoção antes da perda? | sim_nao | ⚪ |
| 7 | Foram retiradas as etiquetas de preço das ofertas do dia anterior? | sim_nao | 🟡 |
| 8 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |
| 9 | Foi verificada a validade dos itens abandejados? | sim_nao | 🔴 |

### 🛍️ Seção 6 — FRENTE DE CAIXA
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | Sacolinhas estão abastecidas? | sim_nao | 🟡 |
| 2 | Checkouts estão limpos? | sim_nao | 🔴 |
| 3 | Equipe da frente de caixa uniformizada? | sim_nao | 🔴 |
| 4 | Carrinhos e cestinhas limpos e na frente da loja? | sim_nao | 🔴 |
| 5 | Check-stands estão abastecidos? | sim_nao | 🔴 |
| 6 | Troco de caixa foi providenciado? | sim_nao | ⚪ |
| 7 | As ofertas estão disponíveis nos PDVs? | sim_nao | 🟡 |
| 8 | Limpeza da frente da loja e estacionamento? | sim_nao | 🔴 |

### 🎯 Seção 7 — PONTAS DE GÔNDOLAS
| # | Pergunta | Tipo | Foto no "Não" |
|---|---|---|---|
| 1 | As pontas estão abastecidas com os produtos do dia? | sim_nao | 🔴 |
| 2 | As pontas estão limpas? | sim_nao | 🔴 |
| 3 | Foram colocadas as placas de promoção do dia atual? | sim_nao | 🔴 |
| 4 | Produtos fora de promoção estão com destaque de preço? | sim_nao | 🟡 |
| 5 | Foram colocados produtos correlacionados (Cross)? | sim_nao | 🟡 |
| 6 | Demais produtos estão todos precificados? | sim_nao | 🔴 |

---

## 6. Itens reutilizáveis (biblioteca)

Alguns itens se repetem em várias seções. No motor do formulário eles viram **itens de biblioteca** — cadastra uma vez, usa em todas as seções. Facilita manutenção e padroniza:

- "Foram retiradas as etiquetas de preço das ofertas do dia anterior?" → 6 seções
- "Foram colocadas as placas de promoção do dia atual?" → 7 seções
- "Os produtos estão com etiquetas de preços?" → 3 seções
- "Está sendo feito o PVPS?" → 2 seções
- "A limpeza está ok?" (variações) → 6 seções

---

## 7. O que o sócio/dono vê (saída do formulário)

1. **Cabeçalho automático:** loja · gerente · data/hora · % de conformidade.
2. **Pendências em destaque:** lista só os itens "Não / ruptura / fora da faixa", cada um com observação e foto.
3. **Detalhe completo:** todas as respostas, se quiser auditar.
4. **Relatórios:** conformidade por loja, itens "Não" recorrentes, comparativo entre lojas, evolução no tempo, temperatura registrada.

---

## 8. Decisões em aberto sobre o formulário

- [x] ~~Temperatura numérica?~~ → **Decidido: Sim/Não na V1, igual ao PDF.**
- [x] ~~Foto obrigatória?~~ → **Decidido: foto OBRIGATÓRIA em todo "Não". Sem foto, não envia.**
- [x] ~~Frequência~~ → **4x/semana em dias fixos** (recomendado Seg/Qua/Sex/Sáb). Horário limite: a definir.
- [ ] Algum item que o gerente preenche **mais de uma vez no dia** (ex.: Padaria item 5 "olhar 2x ao dia")? Isso pode virar 2 registros no mesmo dia.
- [x] ~~Marca?~~ → **Decidido: marca do supermercado** (logo será enviada pelo cliente para aplicar no sistema e materiais).
