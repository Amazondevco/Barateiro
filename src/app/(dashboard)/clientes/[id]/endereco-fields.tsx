"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input, Label } from "@/components/ui/input";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskCEP = (v: string) =>
  onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export type EnderecoInit = {
  cep?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cidade?: string | null;
  uf?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
};

// CEP preenche rua/bairro/cidade/UF + lat/lng (via AwesomeAPI). Número e
// complemento ficam manuais. lat/lng vão em hidden inputs para o geofence.
export function EnderecoFields({ initial = {} }: { initial?: EnderecoInit }) {
  const [cep, setCep] = useState(initial.cep ?? "");
  const [endereco, setEndereco] = useState(initial.endereco ?? "");
  const [bairro, setBairro] = useState(initial.bairro ?? "");
  const [numero, setNumero] = useState(initial.numero ?? "");
  const [complemento, setComplemento] = useState(initial.complemento ?? "");
  const [cidade, setCidade] = useState(initial.cidade ?? "");
  const [uf, setUf] = useState(initial.uf ?? "");
  const [lat, setLat] = useState(initial.geo_lat != null ? String(initial.geo_lat) : "");
  const [lng, setLng] = useState(initial.geo_lng != null ? String(initial.geo_lng) : "");
  const [busca, setBusca] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function buscarCep(valor: string) {
    const c = onlyDigits(valor);
    if (c.length !== 8) return;
    setBusca(true);
    setAviso(null);
    try {
      const r = await fetch(`https://cep.awesomeapi.com.br/json/${c}`);
      if (!r.ok) {
        setAviso("CEP não encontrado.");
        return;
      }
      const d = (await r.json()) as {
        address?: string;
        address_name?: string;
        district?: string;
        city?: string;
        state?: string;
        lat?: string;
        lng?: string;
      };
      if (d.address_name || d.address) setEndereco(d.address_name ?? d.address ?? "");
      if (d.district) setBairro(d.district);
      if (d.city) setCidade(d.city);
      if (d.state) setUf(d.state);
      if (d.lat && d.lng) {
        setLat(d.lat);
        setLng(d.lng);
      } else {
        setAviso("CEP sem coordenadas — preencha lat/lng à mão para o geofence.");
      }
    } catch {
      setAviso("Não foi possível buscar o CEP.");
    } finally {
      setBusca(false);
    }
  }

  return (
    <>
      <div className="sm:col-span-2">
        <Label htmlFor="u_cep">CEP</Label>
        <div className="relative">
          <Input
            id="u_cep"
            name="cep"
            value={cep}
            inputMode="numeric"
            placeholder="00000-000"
            onChange={(e) => {
              const v = maskCEP(e.target.value);
              setCep(v);
              if (onlyDigits(v).length === 8) buscarCep(v);
            }}
          />
          {busca && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {aviso && <p className="mt-1 text-xs text-warning">{aviso}</p>}
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="u_endereco">Rua / Avenida</Label>
        <Input id="u_endereco" name="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u_numero">Número</Label>
        <Input id="u_numero" name="numero" value={numero} inputMode="numeric" onChange={(e) => setNumero(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u_compl">Complemento</Label>
        <Input id="u_compl" name="complemento" value={complemento} placeholder="sala, bloco…" onChange={(e) => setComplemento(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u_bairro">Bairro</Label>
        <Input id="u_bairro" name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u_cidade">Cidade</Label>
        <Input id="u_cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="u_uf">UF</Label>
        <Input id="u_uf" name="uf" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} />
      </div>

      <input type="hidden" name="geo_lat" value={lat} />
      <input type="hidden" name="geo_lng" value={lng} />
      <p className="text-xs text-muted-foreground sm:col-span-2">
        {lat && lng
          ? `Coordenadas: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} (do CEP)`
          : "Sem coordenadas — necessárias para validar a localização nos formulários."}
      </p>
    </>
  );
}
