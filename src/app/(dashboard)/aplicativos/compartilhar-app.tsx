"use client";

import { useState } from "react";
import { Download, Share2, Copy, Check, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// Link de instalação do PWA — domínio de produção (entrada pelo cadastro).
function installUrl(_id: string | undefined) {
  return `https://check-ai-br.vercel.app/cadastro`;
}

function mensagem(nome: string, nomeCurto: string, id: string | undefined) {
  const link = installUrl(id);
  return `📱 *${nome || "Seu aplicativo"}* está pronto para instalar!

Não precisa baixar nada da loja de apps — é um aplicativo web que vai direto para a tela inicial do seu celular.

*Como instalar (leva 30 segundos):*
1. Abra este link no navegador do celular:
${link}
2. Toque no menu do navegador:
   • iPhone (Safari): toque em Compartilhar ⬆️
   • Android (Chrome): toque nos 3 pontinhos ⋮
3. Escolha *"Adicionar à Tela de Início"*
4. Confirme — o ícone *${nomeCurto || nome}* aparece na tela do seu celular 🎉

*Como usar:*
• Toque no ícone *${nomeCurto || nome}* para abrir o app
• Faça login com o acesso que você já recebeu
• Pronto: seus formulários e checklists ficam disponíveis ali

Qualquer dúvida, fale com o gestor da rede.`;
}

export function CompartilharApp({
  icone,
}: {
  icone: { id?: string; nome: string; nomeCurto: string };
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const texto = mensagem(icone.nome, icone.nomeCurto, icone.id);
  const link = installUrl(icone.id);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function compartilharNativo() {
    if (navigator.share) {
      try {
        await navigator.share({ title: icone.nome, text: texto });
      } catch {
        /* usuário cancelou */
      }
    } else {
      copiar();
    }
  }

  function whatsapp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener",
    );
  }

  function baixarInstrucoes() {
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instrucoes-${icone.nomeCurto || icone.nome || "app"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={baixarInstrucoes}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Baixar instruções"
          title="Baixar instruções (.txt)"
        >
          <Download className="h-4 w-4" />
        </button>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </div>

      {open && (
        <Modal title="Compartilhar app" onClose={() => setOpen(false)} size="lg">
          <p className="mb-3 text-sm text-muted-foreground">
            Mensagem pronta com o link de instalação e o passo a passo. Envie
            para os usuários com acesso a este ícone.
          </p>

          <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Link de instalação
            </p>
            <code className="break-all text-sm text-primary">{link}</code>
          </div>

          <textarea
            readOnly
            value={texto}
            className="mb-4 h-64 w-full resize-none rounded-lg border border-input bg-card p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={baixarInstrucoes}>
              <Download className="h-4 w-4" />
              Baixar .txt
            </Button>
            <Button variant="outline" onClick={copiar}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={whatsapp}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button onClick={compartilharNativo}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
