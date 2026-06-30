import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

// Fonte principal = stack do sistema (San Francisco na Apple) — definida em
// globals.css (--font-sans). Só o mono continua via Next font (Geist Mono).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Check.AI — Gestão",
  description: "Plataforma de gestão para redes de supermercado",
  icons: { icon: "/icon.svg", apple: "/icon-512.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Check.AI" },
};

export const viewport: Viewport = {
  themeColor: "#F97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Manifest dinâmico por rede — use-credentials envia o cookie de sessão */}
        <link rel="manifest" href="/api/manifest" crossOrigin="use-credentials" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
