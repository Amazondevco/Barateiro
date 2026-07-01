"use client";

import { useActionState, useState } from "react";
import { Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useActionToast } from "@/components/toast";
import type { FormState } from "@/app/(dashboard)/usuarios/actions";

type Opt = { id: string; nome: string };

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  redeId?: string;
  redes?: Opt[];
  unidades?: Opt[];
  departamentos?: Opt[];
};

export function AddUsuarioForm(props: Props) {
  const [open, setOpen] = useState(false);
  // Remonta o corpo a cada abertura (zera o estado do formulário/sucesso).
  const [instance, setInstance] = useState(0);

  function abrir() {
    setInstance((i) => i + 1);
    setOpen(true);
  }

  return (
    <>
      <Button size="lg" className="font-semibold" onClick={abrir}>
        <Plus className="h-4 w-4" /> Novo usuário
      </Button>

      {open && (
        <Modal title="Novo usuário" onClose={() => setOpen(false)}>
          <CriarUsuarioBody
            key={instance}
            {...props}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}

function CriarUsuarioBody({
  action,
  redeId,
  redes,
  unidades = [],
  departamentos = [],
  onClose,
}: Props & { onClose: () => void }) {
  const [papel, setPapel] = useState<string>("gerente");
  const [state, formAction, pending] = useActionState(action, {});
  const [copiado, setCopiado] = useState(false);
  useActionToast(state, { success: "Usuário criado." });

  const isSuperOption = !redeId;

  async function copiar() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  // Sucesso → mostra o link de acesso (o usuário define a própria senha).
  if (state.ok) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-success-bg p-3 text-success">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Usuário criado</p>
            <p className="mt-0.5 text-xs text-success/80">
              Envie o link abaixo{state.email ? ` para ${state.email}` : ""}{" "}
              definir a própria senha. Ele não expira até ser usado.
            </p>
          </div>
        </div>

        {state.link ? (
          <div>
            <Label>Link de acesso</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={state.link}
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button type="button" variant="outline" onClick={copiar}>
                {copiado ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiado ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use o botão “Gerar link” na lista de usuários para enviar o acesso.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {redeId && <input type="hidden" name="rede_id" value={redeId} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="us_nome">Nome *</Label>
          <Input id="us_nome" name="nome" required />
        </div>
        <div>
          <Label htmlFor="us_email">E-mail *</Label>
          <Input id="us_email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="us_papel">Papel</Label>
          <Select
            id="us_papel"
            name="papel"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
          >
            {isSuperOption && <option value="super_admin">Super Admin</option>}
            <option value="admin_supermercado">Admin da rede</option>
            <option value="gerente">Gerente</option>
          </Select>
        </div>

        {redeId && (
          <div>
            <Label htmlFor="us_depto">Departamento *</Label>
            <Select id="us_depto" name="departamento_id" defaultValue="" required>
              <option value="" disabled>
                Selecione o departamento
              </option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </Select>
            {departamentos.length === 0 && (
              <p className="mt-1 text-xs text-warning">
                Nenhum departamento. Crie em Configurações → Departamentos.
              </p>
            )}
          </div>
        )}

        {!redeId && papel !== "super_admin" && (
          <div className="sm:col-span-2">
            <Label htmlFor="us_rede">Rede</Label>
            <Select id="us_rede" name="rede_id" defaultValue="">
              <option value="" disabled>
                Selecione a rede
              </option>
              {redes?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {redeId && papel === "gerente" && unidades.length > 0 && (
        <div>
          <Label>Unidades sob responsabilidade</Label>
          <div className="flex flex-wrap gap-2">
            {unidades.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="unidade_ids"
                  value={u.id}
                  className="accent-[var(--primary)]"
                />
                {u.nome}
              </label>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
