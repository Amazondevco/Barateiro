import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// Pede a permissão de LOCALIZAÇÃO cedo (no login), em nativo — antes não era
// solicitada (só no envio do checklist, e acabava nunca aparecendo). Idempotente:
// só abre o diálogo quando ainda está pendente.
export async function requestLocationPermission() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await Geolocation.checkPermissions();
    if (
      perm.location === "prompt" ||
      perm.location === "prompt-with-rationale"
    ) {
      await Geolocation.requestPermissions();
    }
  } catch {
    /* usuário negou ou GPS indisponível — o envio do checklist trata o resto */
  }
}
