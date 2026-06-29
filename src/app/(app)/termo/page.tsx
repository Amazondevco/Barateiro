import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TERMO_PRIVACIDADE } from "@/lib/termo-privacidade";

export const metadata = { title: "Termo de Privacidade — Check.AI" };

// Render simples do termo (markdown leve → blocos).
export default function TermoPage() {
  const linhas = TERMO_PRIVACIDADE.split("\n");
  return (
    <div className="flex flex-col gap-3 p-5">
      <Link
        href="/cadastro"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao cadastro
      </Link>
      <article className="prose-sm space-y-2 text-sm leading-relaxed text-foreground">
        {linhas.map((l, i) => {
          if (l.startsWith("# "))
            return <h1 key={i} className="text-lg font-bold">{l.slice(2)}</h1>;
          if (l.startsWith("## "))
            return <h2 key={i} className="mt-3 text-base font-semibold">{l.slice(3)}</h2>;
          if (l.startsWith("- "))
            return <li key={i} className="ml-4 list-disc">{l.slice(2)}</li>;
          if (l.trim() === "---")
            return <hr key={i} className="my-3 border-border" />;
          if (l.trim() === "") return <div key={i} className="h-1" />;
          if (l.startsWith("**") && l.endsWith("**"))
            return <p key={i} className="font-semibold">{l.replaceAll("**", "")}</p>;
          return <p key={i} className="text-muted-foreground">{l}</p>;
        })}
      </article>
    </div>
  );
}
