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
});
