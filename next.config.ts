import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parsers de documento rodam no servidor (não empacotar com o bundle)
  serverExternalPackages: ["pdf-parse", "mammoth", "xlsx"],
  experimental: {
    serverActions: {
      // Permite upload de arquivos maiores nas server actions (import de forms)
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
