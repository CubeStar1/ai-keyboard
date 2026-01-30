import { is } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";
import { join } from "path";
import { AppState } from "../app-state";
import { getOrStartNextJSServer } from "./main-window";

export const createSettingsWindow = (): BrowserWindow => {
  if (AppState.settingsWindow) {
    AppState.settingsWindow.focus();
    return AppState.settingsWindow;
  }

  AppState.settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    frame: true,
    title: "AI Keyboard Settings",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  if (is.dev) {
    AppState.settingsWindow.loadURL("http://localhost:3000/settings");
  } else {
    getOrStartNextJSServer().then((port) => {
      AppState.settingsWindow?.loadURL(`http://localhost:${port}/settings`);
    });
  }

  AppState.settingsWindow.on("closed", () => {
    AppState.settingsWindow = null;
  });

  return AppState.settingsWindow;
};
