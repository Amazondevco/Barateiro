"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Download,
  ClipboardList,
  ShieldCheck,
  Smartphone,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PERMISSOES } from "@/lib/permissoes";
import { cn } from "@/lib/utils";
import {
  updateDepartamentosPadrao,
  updateUnidadesPadrao,
  updateUsuariosPadrao,
  updatePermissoesPadrao,
  salvarAplicativoPadrao,
  type CadastroCampo,
  type FormState,
} from "./plataforma-actions";

function Status({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
        Padrão salvo.
      </p>
    );
  return null;
}

function Header({ titulo, desc }: { titulo: string; desc: string }) {
  return (
    <div>
      <h3 className="font-semibold">{titulo}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ---------- Departamentos padrão ---------- */
export function DepartamentosPadraoForm({ lista }: { lista: string[] }) {
  const [state, action, pending] = useActionState(
    updateDepartamentosPadrao,
    {} as FormState,
  );
  return (
    <Card>
      <CardContent>
        <form action={action} className="max-w-2xl space-y-4">
          <Header
            titulo="Departamentos padrão"
            desc="Toda rede nova já nasce com estes departamentos. Um por linha."
          />
          <Textarea
            name="departamentos"
            rows={8}
            defaultValue={lista.join("\n")}
            placeholder={"Hortifrúti\nAçougue\nPadaria\nMercearia"}
          />
          <Status state={state} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Unidades padrão ---------- */
const TIPOS = [
  { v: "loja", l: "Loja" },
  { v: "cd", l: "CD / Galpão" },
  { v: "escritorio", l: "Escritório" },
  { v: "outro", l: "Outro" },
];
export function UnidadesPadraoForm({ tipos }: { tipos: string[] }) {
  const [state, action, pending] = useActionState(
    updateUnidadesPadrao,
    {} as FormState,
  );
  return (
    <Card>
      <CardContent>
        <form action={action} className="max-w-2xl space-y-4">
          <Header
            titulo="Unidades padrão"
            desc="Tipos de unidade disponíveis para as redes ao cadastrar lojas, CDs, etc."
          />
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <label
                key={t.v}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="tipos"
                  value={t.v}
                  defaultChecked={tipos.includes(t.v)}
                  className="accent-[var(--primary)]"
                />
                {t.l}
              </label>
            ))}
          </div>
          <Status state={state} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Usuários padrão ---------- */
export function UsuariosPadraoForm({
  papel,
  status,
  limite,
}: {
  papel: string;
  status: string;
  limite: number | null;
}) {
  const [state, action, pending] = useActionState(
    updateUsuariosPadrao,
    {} as FormState,
  );
  return (
    <Card>
      <CardContent>
        <form action={action} className="max-w-2xl space-y-4">
          <Header
            titulo="Usuários padrão"
            desc="Valores iniciais ao criar usuários numa rede."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="papel">Papel padrão</Label>
              <Select id="papel" name="papel" defaultValue={papel}>
                <option value="gerente">Gerente</option>
                <option value="admin_supermercado">Admin da rede</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status inicial</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="limite">Limite por rede</Label>
              <Input
                id="limite"
                name="limite"
                type="number"
                min={1}
                defaultValue={limite ?? ""}
                placeholder="Sem limite"
              />
            </div>
          </div>
          <Status state={state} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Permissões padrão ---------- */
const CARGOS_PADRAO = [
  { campo: "admin", nome: "Admin", desc: "Acesso total à rede." },
  { campo: "gerente", nome: "Gerente", desc: "Gerencia a operação da loja." },
  {
    campo: "colaborador",
    nome: "Colaborador",
    desc: "Preenche checklists.",
  },
] as const;

export function PermissoesPadraoForm({
  admin,
  gerente,
  colaborador,
}: {
  admin: string[];
  gerente: string[];
  colaborador: string[];
}) {
  const [state, action, pending] = useActionState(
    updatePermissoesPadrao,
    {} as FormState,
  );
  const valores: Record<string, string[]> = { admin, gerente, colaborador };

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-6">
          <Header
            titulo="Permissões padrão"
            desc="Define o que cada cargo de sistema pode fazer ao nascer uma rede nova."
          />
          {CARGOS_PADRAO.map((c) => (
            <div key={c.campo} className="space-y-3 border-t border-border pt-4">
              <div>
                <h4 className="text-sm font-semibold">{c.nome}</h4>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
              {PERMISSOES.map((g) => (
                <div key={g.grupo}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {g.grupo}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.itens.map((it) => (
                      <label
                        key={it.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                      >
                        <input
                          type="checkbox"
                          name={c.campo}
                          value={it.key}
                          defaultChecked={valores[c.campo].includes(it.key)}
                          className="accent-[var(--primary)]"
                        />
                        {it.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <Status state={state} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Aplicativo padrão ---------- */
const APP_OPTS = [
  {
    name: "foto",
    label: "Foto obrigatória ao reprovar um item",
    desc: "Exige foto quando o gerente marca NÃO/Ruptura.",
  },
  {
    name: "geo",
    label: "Geolocalização no envio",
    desc: "Registra a localização ao enviar o checklist.",
  },
  {
    name: "assinatura",
    label: "Assinatura no final",
    desc: "Pede a assinatura do gerente ao concluir.",
  },
  {
    name: "offline",
    label: "Modo offline",
    desc: "Permite preencher sem internet e sincronizar depois.",
  },
] as const;

const TIPO_CAMPO = [
  { v: "texto", l: "Texto" },
  { v: "email", l: "E-mail" },
  { v: "telefone", l: "Telefone" },
  { v: "numero", l: "Número" },
  { v: "data", l: "Data" },
  { v: "foto", l: "Foto" },
];

export function AplicativoPadraoForm({
  foto,
  geo,
  assinatura,
  offline,
  exigeCadastro,
  aprovacaoAdmin,
  campos,
}: {
  foto: boolean;
  geo: boolean;
  assinatura: boolean;
  offline: boolean;
  exigeCadastro: boolean;
  aprovacaoAdmin: boolean;
  campos: CadastroCampo[];
}) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();

  const [vFoto, setVFoto] = useState(foto);
  const [vGeo, setVGeo] = useState(geo);
  const [vAssin, setVAssin] = useState(assinatura);
  const [vOffline, setVOffline] = useState(offline);
  const [vExige, setVExige] = useState(exigeCadastro);
  const [vAprov, setVAprov] = useState(aprovacaoAdmin);
  const [lista, setLista] = useState<CadastroCampo[]>(
    campos.length
      ? campos
      : [{ label: "Nome completo", tipo: "texto", obrigatorio: true }],
  );

  const toggles: { v: boolean; set: (b: boolean) => void; o: typeof APP_OPTS[number] }[] =
    [
      { v: vFoto, set: setVFoto, o: APP_OPTS[0] },
      { v: vGeo, set: setVGeo, o: APP_OPTS[1] },
      { v: vAssin, set: setVAssin, o: APP_OPTS[2] },
      { v: vOffline, set: setVOffline, o: APP_OPTS[3] },
    ];

  function patchCampo(i: number, patch: Partial<CadastroCampo>) {
    setLista((l) => l.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  }

  function salvar() {
    setState({});
    start(async () => {
      const r = await salvarAplicativoPadrao({
        foto: vFoto,
        geo: vGeo,
        assinatura: vAssin,
        offline: vOffline,
        exigeCadastro: vExige,
        aprovacaoAdmin: vAprov,
        campos: lista,
      });
      setState(r);
    });
  }

  // Fluxo: Baixar → Cadastro → [Aprovação] → Acesso
  const fluxo: { icon: LucideIcon; titulo: string; desc: string }[] = [
    {
      icon: Download,
      titulo: "1. Baixar o app",
      desc: "O gerente instala o aplicativo no celular.",
    },
    {
      icon: ClipboardList,
      titulo: "2. Preencher cadastro",
      desc: vExige
        ? "Obrigatório: sem completar os dados, não acessa o app."
        : "Opcional: o gerente pode acessar sem completar.",
    },
    ...(vAprov
      ? [
          {
            icon: ShieldCheck,
            titulo: "3. Aprovação do admin",
            desc: "O admin da rede revisa e libera o acesso.",
          },
        ]
      : []),
    {
      icon: Smartphone,
      titulo: `${vAprov ? 4 : 3}. Acessar e preencher`,
      desc: "Liberado, o gerente passa a preencher os checklists.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Funcionalidades */}
      <Card>
        <CardContent className="space-y-4">
          <Header
            titulo="Funcionalidades do app"
            desc="Como o app dos gerentes funciona por padrão nas redes novas."
          />
          <div className="space-y-2">
            {toggles.map(({ v, set, o }) => (
              <label
                key={o.name}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  checked={v}
                  onChange={(e) => set(e.target.checked)}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {o.desc}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de acesso */}
      <Card>
        <CardContent className="space-y-4">
          <Header
            titulo="Fluxo de acesso do app"
            desc="Como o gerente entra no app — do download ao primeiro checklist."
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fluxo.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.titulo}
                  className="rounded-xl border border-border bg-muted/30 p-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-2 text-sm font-semibold">{f.titulo}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input
                type="checkbox"
                checked={vExige}
                onChange={(e) => setVExige(e.target.checked)}
                className="mt-0.5 accent-[var(--primary)]"
              />
              <span>
                <span className="block text-sm font-medium">
                  Exigir cadastro completo para acessar
                </span>
                <span className="block text-xs text-muted-foreground">
                  Sem preencher os dados obrigatórios, o gerente não acessa o
                  app.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <input
                type="checkbox"
                checked={vAprov}
                onChange={(e) => setVAprov(e.target.checked)}
                className="mt-0.5 accent-[var(--primary)]"
              />
              <span>
                <span className="block text-sm font-medium">
                  Aprovação do admin antes de liberar
                </span>
                <span className="block text-xs text-muted-foreground">
                  O acesso só é liberado após o admin da rede aprovar o cadastro.
                </span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Campos do cadastro */}
      <Card>
        <CardContent className="space-y-4">
          <Header
            titulo="Cadastro do gerente"
            desc="Dados que o gerente precisa preencher para liberar o acesso."
          />
          <div className="space-y-2">
            {lista.map((c, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2 sm:flex-nowrap"
              >
                <Input
                  value={c.label}
                  onChange={(e) => patchCampo(i, { label: e.target.value })}
                  placeholder="Nome do campo (ex.: CPF)"
                  className="h-9 min-w-40 flex-1"
                />
                <Select
                  value={c.tipo}
                  onChange={(e) => patchCampo(i, { tipo: e.target.value })}
                  className="h-9 w-full sm:w-36"
                >
                  {TIPO_CAMPO.map((t) => (
                    <option key={t.v} value={t.v}>
                      {t.l}
                    </option>
                  ))}
                </Select>
                <label
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
                    c.obrigatorio
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-input text-muted-foreground",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={c.obrigatorio}
                    onChange={(e) =>
                      patchCampo(i, { obrigatorio: e.target.checked })
                    }
                    className="accent-[var(--primary)]"
                  />
                  Obrigatório
                </label>
                <button
                  type="button"
                  onClick={() => setLista((l) => l.filter((_, k) => k !== i))}
                  aria-label="Remover campo"
                  className="shrink-0 text-muted-foreground hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLista((l) => [
                ...l,
                { label: "", tipo: "texto", obrigatorio: false },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Adicionar campo
          </Button>

          <Status state={state} />
          <div className="flex justify-end">
            <Button type="button" onClick={salvar} disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrão"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
