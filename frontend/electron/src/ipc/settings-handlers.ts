import { ipcMain } from "electron";
import { AppState, getStore } from "../app-state";
import {
  startClipboardWatcher,
  stopClipboardWatcher,
  initializeGhostText,
  cleanupGhostText,
  startKeystrokeListening,
  stopKeystrokeListening,
} from "../services";
import type { TextOutputMode } from "../services";

export const registerSettingsHandlers = (): void => {
  ipcMain.handle("get-suggestion-mode", () => AppState.suggestionMode);

  ipcMain.on("set-suggestion-mode", (_, mode: "hotkey" | "auto") => {
    console.log("[Settings] Suggestion mode changed to:", mode);
    AppState.suggestionMode = mode;

    if (mode === "auto") {
      startClipboardWatcher();
    } else {
      stopClipboardWatcher();
    }
  });

  ipcMain.handle("get-text-output-mode", () => AppState.textOutputMode);

  ipcMain.on("set-text-output-mode", (_, mode: TextOutputMode) => {
    console.log("[Settings] Text output mode changed to:", mode);
    AppState.textOutputMode = mode;
  });

  ipcMain.handle("get-context-capture-enabled", () => {
    return AppState.contextCaptureService?.isEnabled() ?? false;
  });

  ipcMain.on("set-context-capture-enabled", (_, enabled: boolean) => {
    AppState.contextCaptureService?.updateConfig({ enabled });
    if (AppState.brainPanelWindow && !AppState.brainPanelWindow.isDestroyed()) {
      AppState.brainPanelWindow.webContents.send("capture-status-changed", enabled);
    }
  });

  ipcMain.handle("get-ghost-text-enabled", () => AppState.ghostTextEnabled);

  ipcMain.on("set-ghost-text-enabled", (_, enabled: boolean) => {
    console.log("[Settings] Ghost text enabled:", enabled);
    AppState.ghostTextEnabled = enabled;

    if (enabled) {
      initializeGhostText();
      
      if (AppState.keyboardMonitor) {
        AppState.keyboardMonitor.setAutoTriggerConfig({
          enabled: AppState.ghostTextAutoTrigger,
          delayMs: AppState.ghostTextAutoTriggerDelay,
        });
      }

      if (AppState.ghostTextAutoTrigger) {
        startKeystrokeListening();
      }
    } else {
      cleanupGhostText();
    }
  });

  ipcMain.handle("get-ghost-text-auto-trigger", () => AppState.ghostTextAutoTrigger);

  ipcMain.on("set-ghost-text-auto-trigger", (_, enabled: boolean) => {
    console.log("[Settings] Ghost text auto-trigger:", enabled);
    AppState.ghostTextAutoTrigger = enabled;

    if (AppState.keyboardMonitor) {
      AppState.keyboardMonitor.setAutoTriggerConfig({ enabled });
    }

    if (enabled && AppState.ghostTextEnabled) {
      startKeystrokeListening();
    } else {
      stopKeystrokeListening();
    }
  });

  ipcMain.handle("get-ghost-text-auto-trigger-delay", () => AppState.ghostTextAutoTriggerDelay);

  ipcMain.on("set-ghost-text-auto-trigger-delay", (_, delayMs: number) => {
    console.log("[Settings] Ghost text auto-trigger delay:", delayMs);
    AppState.ghostTextAutoTriggerDelay = delayMs;

    if (AppState.keyboardMonitor) {
      AppState.keyboardMonitor.setAutoTriggerConfig({ delayMs });
    }
  });

  ipcMain.on("set-user-id", (_, userId: string) => {
    console.log("[Auth] Setting User ID:", userId);
    getStore().set("userId", userId);
    AppState.currentUserId = userId;
  });

  ipcMain.handle("get-user-id", () => {
    return getStore().get("userId");
  });
};
