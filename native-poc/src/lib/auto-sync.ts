import { Network } from "@capacitor/network";
import { App as CapacitorApp } from "@capacitor/app";
import { initializeQueueStore } from "./queue-store";
import { syncQueue } from "./sync";

// Sincronização automática e contínua, sem ação do usuário:
// dispara ao abrir o app, ao voltar do background, ao reconectar a internet
// e por um backstop periódico. Itens com erro são re-tentados a cada gatilho.

let running = false;
let bound = false;
let timer: ReturnType<typeof setInterval> | null = null;

export async function runSync() {
  if (running) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  running = true;
  try {
    await syncQueue();
  } catch {
    /* tenta de novo no próximo gatilho */
  } finally {
    running = false;
  }
}

export async function startAutoSync() {
  await initializeQueueStore();
  void runSync(); // ao abrir / login

  if (bound) return;
  bound = true;

  // Reconexão: assim que a internet volta, esvazia a fila.
  void Network.addListener("networkStatusChange", (status) => {
    if (status.connected) void runSync();
  });

  // Voltar do background para o primeiro plano.
  void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
    if (isActive) void runSync();
  });

  // Backstop: tenta a cada 45s (no-op se a fila estiver vazia ou offline).
  timer = setInterval(() => void runSync(), 45_000);
}

export function stopAutoSync() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
