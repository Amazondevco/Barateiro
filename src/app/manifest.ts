import type { MetadataRoute } from "next";

// Manifest do PWA — torna o app instalável ("Adicionar à tela inicial").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Super Barateiro",
    short_name: "Barateiro",
    description: "App de checklists e formulários da rede.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fef9c3",
    theme_color: "#F97316",
    icons: [
      {
        src: "/icon-512.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
