import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform } from "./platform";

// Cores de fundo do app (devem bater com --background em styles.css).
const BG_LIGHT = "#f6f7f9";
const BG_DARK = "#0b1120";

// Aplica a barra de status do sistema conforme a tela e o tema:
// - Telas normais: barra SÓLIDA com o fundo do tema (não sobrepõe o conteúdo).
// - Início da rede (imersiva): banner colorido sobe até o topo (overlay).
// Ícones claros no tema escuro, escuros no tema claro (Style.Dark = ícones claros).
export async function aplicarStatusBar(
  imersivo: boolean,
  dark: boolean,
): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    // Na imersiva (banner colorido) os ícones ficam claros; senão, seguem o tema.
    await StatusBar.setStyle({ style: imersivo || dark ? Style.Dark : Style.Light });
    if (imersivo) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    } else {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: dark ? BG_DARK : BG_LIGHT });
    }
  } catch {
    /* iOS não suporta setBackgroundColor / plugin ausente — ignora */
  }
}

export function temaEscuro(): boolean {
  return document.documentElement.classList.contains("dark");
}
