"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PERMISSOES } from "@/lib/permissoes";
import {
  updateDepartamentosPadrao,
  updateUnidadesPadrao,
  updateUsuariosPadrao,
  updateAplicativoPadrao,
  updatePermissoesPadrao,
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

export function AplicativoPadraoForm({
  foto,
  geo,
  assinatura,
  offline,
}: {
  foto: boolean;
  geo: boolean;
  assinatura: boolean;
  offline: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateAplicativoPadrao,
    {} as FormState,
  );
  const valores: Record<string, boolean> = { foto, geo, assinatura, offline };
  return (
    <Card>
      <CardContent>
        <form action={action} className="max-w-2xl space-y-4">
          <Header
            titulo="Aplicativo padrão"
            desc="Como o app dos gerentes funciona por padrão nas redes novas."
          />
          <div className="space-y-2">
            {APP_OPTS.map((o) => (
              <label
                key={o.name}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name={o.name}
                  defaultChecked={valores[o.name]}
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
