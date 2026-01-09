import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("electron", {
  onShowMenu: (callback: (text: string) => void) => {
    ipcRenderer.on("show-menu", (_: IpcRendererEvent, text: string) => callback(text));
  },
  replaceText: (text: string) => ipcRenderer.send("replace-text", text),
  closeMenu: () => ipcRenderer.send("close-menu"),
});
