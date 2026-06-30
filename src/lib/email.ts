"use server";

// Envio de e-mail transacional via Resend (sem dependência: usa a REST API).
// Config por env: RESEND_API_KEY (obrigatório) e EMAIL_FROM (opcional; default
// usa o remetente de teste do Resend até um domínio próprio ser verificado).
export async function enviarEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "Envio de e-mail não configurado (RESEND_API_KEY)." };

  const from = process.env.EMAIL_FROM || "Check.AI <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { error: `Resend ${res.status}: ${txt.slice(0, 300)}` };
  }
  return { ok: true };
}

const GREEN = "#15803d";

// Template do e-mail de convite do responsável da rede.
export async function emailConviteHtml(input: {
  redeNome: string;
  contatoNome: string;
  link: string;
}): Promise<string> {
  const ola = input.contatoNome ? `Olá, ${input.contatoNome}!` : "Olá!";
  return `
  <div style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="background:${GREEN};padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold">
        Check.AI
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 12px;font-size:16px">${ola}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
          Você foi convidado para administrar <strong>${input.redeNome}</strong> no Check.AI.
          Clique no botão abaixo para concluir seu cadastro e criar sua senha.
        </p>
        <p style="margin:24px 0;text-align:center">
          <a href="${input.link}"
             style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;
                    padding:12px 24px;border-radius:10px;font-size:15px;font-weight:bold">
            Concluir cadastro
          </a>
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">
          Se o botão não funcionar, copie e cole este link no navegador:<br>
          <span style="word-break:break-all;color:${GREEN}">${input.link}</span>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">
          O link expira em algumas horas. Se você não esperava este convite, ignore este e-mail.
        </p>
      </div>
    </div>
  </div>`;
}
