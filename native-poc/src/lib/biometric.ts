import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { isNativePlatform } from "./platform";

const KEY = "checkai-biometric";

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(KEY) === "1";
}

export function setBiometricEnabled(on: boolean): void {
  if (on) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
}

// Biometria só existe em nativo e quando o aparelho tem digital/face cadastrada.
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const r = await BiometricAuth.checkBiometry();
    return r.isAvailable;
  } catch {
    return false;
  }
}

// Prompt de biometria; resolve true se autenticou, false se cancelou/falhou.
export async function verifyBiometric(): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason: "Desbloquear o Check.AI",
      androidTitle: "Check.AI",
      androidSubtitle: "Confirme sua identidade",
      cancelTitle: "Cancelar",
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}
