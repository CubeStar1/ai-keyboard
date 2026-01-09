import { is } from "@electron-toolkit/utils";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { readFileSync } from "fs";
import { getPort } from "get-port-please";
import { startServer } from "next/dist/server/lib/start-server";
import { join } from "path";
import { captureSelectedText, pasteToLastWindow } from "./text-handler";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    focusable: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  const loadURL = async () => {
    if (is.dev) {
      mainWindow?.loadURL("http://localhost:3000");
    } else {
      try {
        const port = await startNextJSServer();
        console.log("Next.js server started on port:", port);
        mainWindow?.loadURL(`http://localhost:${port}`);
      } catch (error) {
        console.error("Error starting Next.js server:", error);
      }
    }
  };

  loadURL();
  return mainWindow;
};

const startNextJSServer = async () => {
  try {
    const nextJSPort = await getPort({ portRange: [30_011, 50_000] });
    const webDir = join(app.getAppPath(), "app");

    const configFilePath = join(webDir, ".next", "required-server-files.json");
    const configFile = JSON.parse(readFileSync(configFilePath, "utf-8"));
    const nextConfig = configFile.config;
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

    await startServer({
      dir: webDir,
      isDev: false,
      hostname: "localhost",
      port: nextJSPort,
      customServer: true,
      allowRetry: false,
      keepAliveTimeout: 5000,
      minimalMode: true,
    });

    return nextJSPort;
  } catch (error) {
    console.error("Error starting Next.js server:", error);
    throw error;
  }
};

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("CommandOrControl+\\", async () => {
    if (!mainWindow) return;

    try {
      const selectedText = await captureSelectedText();
      console.log("Captured text:", selectedText.slice(0, 50));
      mainWindow.webContents.send("show-menu", selectedText);
      mainWindow.show();
      mainWindow.focus();
    } catch (error) {
      console.error("Error capturing text:", error);
    }
  });

  ipcMain.on("replace-text", async (_, text: string) => {
    try {
      console.log("Replace text requested:", text.slice(0, 50));
      mainWindow?.hide();
      await new Promise((r) => setTimeout(r, 100));
      await pasteToLastWindow(text);
      console.log("Paste completed");
    } catch (error) {
      console.error("Error replacing text:", error);
    }
  });

  ipcMain.on("close-menu", () => {
    mainWindow?.hide();
  });

  ipcMain.on("ping", () => console.log("pong"));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
