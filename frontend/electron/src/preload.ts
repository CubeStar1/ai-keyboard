import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("electron", {
  onShowMenu: (callback: (text: string) => void) => {
    const handler = (_: IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on("show-menu", handler);
    return () => ipcRenderer.removeListener("show-menu", handler);
  },
  replaceText: (text: string) => ipcRenderer.send("replace-text", text),
  closeMenu: () => ipcRenderer.send("close-menu"),
  resizeWindow: (size: { width?: number; height?: number }) =>
    ipcRenderer.send("resize-window", size),
  moveWindow: (delta: { x: number; y: number }) =>
    ipcRenderer.send("move-window", delta),
  openSettings: () => ipcRenderer.send("open-settings"),
  
  onShowSuggestion: (callback: (data: { context: string }) => void) => {
    const handler = (_: IpcRendererEvent, data: { context: string }) => callback(data);
    ipcRenderer.on("show-suggestion", handler);
    return () => ipcRenderer.removeListener("show-suggestion", handler);
  },
  acceptSuggestion: (text: string) => ipcRenderer.send("accept-suggestion", text),
  dismissSuggestion: () => ipcRenderer.send("dismiss-suggestion"),
  
  getSuggestionMode: () => ipcRenderer.invoke("get-suggestion-mode"),
  setSuggestionMode: (mode: "hotkey" | "auto") => ipcRenderer.send("set-suggestion-mode", mode),
  
  getTextOutputMode: () => ipcRenderer.invoke("get-text-output-mode"),
  setTextOutputMode: (mode: "paste" | "typewriter") => ipcRenderer.send("set-text-output-mode", mode),

  toggleBrainPanel: () => ipcRenderer.send("toggle-brain-panel"),
  setBrainPanelCollapsed: (collapsed: boolean) =>
    ipcRenderer.send("set-brain-panel-collapsed", collapsed),
  
  onMemoryStored: (callback: (memory: string) => void) => {
    const handler = (_: IpcRendererEvent, memory: string) => callback(memory);
    ipcRenderer.on("memory-stored", handler);
    return () => ipcRenderer.removeListener("memory-stored", handler);
  },
  
  onCaptureStatusChanged: (callback: (enabled: boolean) => void) => {
    const handler = (_: IpcRendererEvent, enabled: boolean) => callback(enabled);
    ipcRenderer.on("capture-status-changed", handler);
    return () => ipcRenderer.removeListener("capture-status-changed", handler);
  },

  getContextCaptureEnabled: () => ipcRenderer.invoke("get-context-capture-enabled"),
  setContextCaptureEnabled: (enabled: boolean) =>
    ipcRenderer.send("set-context-capture-enabled", enabled),

  captureScreen: () => ipcRenderer.invoke("capture-screen"),

  onAnalyzeScreenshot: (callback: (data: { dataUrl: string; timestamp: string }) => void) => {
    const handler = (_: IpcRendererEvent, data: { dataUrl: string; timestamp: string }) => callback(data);
    ipcRenderer.on("analyze-screenshot", handler);
    return () => ipcRenderer.removeListener("analyze-screenshot", handler);
  },
  openExternal: (url: string) => ipcRenderer.send("open-external", url),
  notifyAnalysisComplete: (success: boolean) =>
    ipcRenderer.send("analysis-complete", success),

  // Ghost Text Overlay
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  removeListener: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  getGhostTextEnabled: () => ipcRenderer.invoke("get-ghost-text-enabled"),
  setGhostTextEnabled: (enabled: boolean) => ipcRenderer.send("set-ghost-text-enabled", enabled),

  // User ID Persistence
  setUserId: (userId: string) => ipcRenderer.send("set-user-id", userId),
  getUserId: () => ipcRenderer.invoke("get-user-id"),
});
