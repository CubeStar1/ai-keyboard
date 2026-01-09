import { is } from "@electron-toolkit/utils";
import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, screen } from "electron";
import { readFileSync } from "fs";
import { getPort } from "get-port-please";
import { startServer } from "next/dist/server/lib/start-server";
import { join } from "path";
import { captureSelectedText, pasteToLastWindow } from "./text-handler";

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let suggestionWindow: BrowserWindow | null = null;
let nextJSPort: number | null = null;

let suggestionMode: "hotkey" | "auto" = "hotkey";
let clipboardWatcher: NodeJS.Timeout | null = null;
let lastClipboardContent = "";
let isInternalClipboardOp = false;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    minWidth: 400,
    minHeight: 400,
    maxWidth: 800,
    maxHeight: 800,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
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
        const port = await getOrStartNextJSServer();
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

const getOrStartNextJSServer = async () => {
  if (nextJSPort) return nextJSPort;
  
  try {
    nextJSPort = await getPort({ portRange: [30_011, 50_000] });
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



const createSuggestionWindow = (initialContext: string) => {
  if (suggestionWindow && !suggestionWindow.isDestroyed()) {
    return suggestionWindow;
  }

  const cursorPoint = screen.getCursorScreenPoint();
  
  suggestionWindow = new BrowserWindow({
    width: 420,
    height: 150,
    maxHeight: 300,
    x: cursorPoint.x + 10,
    y: cursorPoint.y + 10,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    show: false,
    focusable: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  if (is.dev) {
    suggestionWindow.loadURL("http://localhost:3000/suggestion");
  } else {
    getOrStartNextJSServer().then((port) => {
      suggestionWindow?.loadURL(`http://localhost:${port}/suggestion`);
    });
  }

  suggestionWindow.on("closed", () => {
    suggestionWindow = null;
  });

  return suggestionWindow;
};

const startClipboardWatcher = () => {
  if (clipboardWatcher) return;
  
  lastClipboardContent = clipboard.readText();
  
  clipboardWatcher = setInterval(() => {
    if (isInternalClipboardOp) return;
    
    const currentContent = clipboard.readText();
    
    if (currentContent !== lastClipboardContent && currentContent.length >= 5) {
      lastClipboardContent = currentContent;
      console.log("[Auto-suggest] Clipboard changed:", currentContent.slice(0, 50));
      showSuggestionForContext(currentContent);
    }
  }, 500);
  
  console.log("[Auto-suggest] Clipboard watcher started");
};

const stopClipboardWatcher = () => {
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
    clipboardWatcher = null;
    console.log("[Auto-suggest] Clipboard watcher stopped");
  }
};

const showSuggestionForContext = async (context: string) => {
  const window = createSuggestionWindow(context);
  
  const cursorPoint = screen.getCursorScreenPoint();
  window.setPosition(cursorPoint.x + 10, cursorPoint.y + 10);
  
  if (!window.webContents.isLoading()) {
    window.webContents.send("show-suggestion", { context });
    window.show();
  } else {
    window.webContents.once("did-finish-load", async () => {
      await new Promise((r) => setTimeout(r, 100));
      window.webContents.send("show-suggestion", { context });
      window.show();
    });
  }
};

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("CommandOrControl+\\", async () => {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      try {
        const selectedText = await captureSelectedText();
        console.log("Captured text:", selectedText.slice(0, 50));
        mainWindow.webContents.send("show-menu", selectedText);
        mainWindow.show();
        mainWindow.focus();
      } catch (error) {
        console.error("Error capturing text:", error);
      }
    }
  });

  globalShortcut.register("CommandOrControl+Space", async () => {
    try {
      if (suggestionWindow && !suggestionWindow.isDestroyed() && suggestionWindow.isVisible()) {
        suggestionWindow.hide();
        return;
      }
      
      const context = await captureSelectedText();
      
      if (context.length < 5) {
        console.log("Context too short for suggestion");
        return;
      }

      console.log("Suggestion requested, context:", context.slice(0, 50));
      
      const window = createSuggestionWindow(context);
      
      const cursorPoint = screen.getCursorScreenPoint();
      window.setPosition(cursorPoint.x + 10, cursorPoint.y + 10);
      
      if (!window.webContents.isLoading()) {
        window.webContents.send("show-suggestion", { context });
        window.show();
        window.focus();
      } else {
        window.webContents.once("did-finish-load", async () => {
          await new Promise((r) => setTimeout(r, 100));
          console.log("Sending show-suggestion IPC");
          window.webContents.send("show-suggestion", { context });
          window.show();
          window.focus();
        });
      }
    } catch (error) {
      console.error("Error getting suggestion:", error);
    }
  });

  ipcMain.on("replace-text", async (_, text: string) => {
    try {
      console.log("Replace text requested:", text.slice(0, 50));
      mainWindow?.hide();
      
      isInternalClipboardOp = true;
      await new Promise((r) => setTimeout(r, 100));
      await pasteToLastWindow(text);
      lastClipboardContent = clipboard.readText();
      isInternalClipboardOp = false;
      
      console.log("Paste completed");
    } catch (error) {
      isInternalClipboardOp = false;
      console.error("Error replacing text:", error);
    }
  });

  ipcMain.on("accept-suggestion", async (_, text: string) => {
    try {
      console.log("Accept suggestion:", text.slice(0, 50));
      suggestionWindow?.hide();
      
      isInternalClipboardOp = true;
      await new Promise((r) => setTimeout(r, 100));
      await pasteToLastWindow(text);
      lastClipboardContent = clipboard.readText();
      isInternalClipboardOp = false;
      
      console.log("Suggestion pasted");
    } catch (error) {
      isInternalClipboardOp = false;
      console.error("Error accepting suggestion:", error);
    }
  });

  ipcMain.on("dismiss-suggestion", () => {
    suggestionWindow?.hide();
  });

  ipcMain.handle("get-suggestion-mode", () => suggestionMode);
  
  ipcMain.on("set-suggestion-mode", (_, mode: "hotkey" | "auto") => {
    console.log("[Settings] Suggestion mode changed to:", mode);
    suggestionMode = mode;
    
    if (mode === "auto") {
      startClipboardWatcher();
    } else {
      stopClipboardWatcher();
    }
  });

  ipcMain.on("open-settings", () => {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }

    settingsWindow = new BrowserWindow({
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
      settingsWindow.loadURL("http://localhost:3000/settings");
    } else {
      getOrStartNextJSServer().then((port) => {
        settingsWindow?.loadURL(`http://localhost:${port}/settings`);
      });
    }

    settingsWindow.on("closed", () => {
      settingsWindow = null;
    });
  });

  ipcMain.on("close-menu", () => {
    mainWindow?.hide();
  });

  ipcMain.on("resize-window", (_, { width, height }: { width?: number; height?: number }) => {
    if (!mainWindow) return;
    const currentBounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: currentBounds.x,
      y: currentBounds.y,
      width: width ?? currentBounds.width,
      height: height ?? currentBounds.height,
    });
  });

  ipcMain.on("move-window", (_, { x, y }: { x: number; y: number }) => {
    if (!mainWindow) return;
    const currentBounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: currentBounds.x + x,
      y: currentBounds.y + y,
      width: currentBounds.width,
      height: currentBounds.height,
    });
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
