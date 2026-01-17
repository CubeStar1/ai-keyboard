import { is } from "@electron-toolkit/utils";
import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Menu, screen, Tray, nativeImage, desktopCapturer, shell } from "electron";
import { readFileSync } from "fs";
import { getPort } from "get-port-please";
import { startServer } from "next/dist/server/lib/start-server";
import { join } from "path";
import { captureLastActiveWindow, captureSelectedText, sendTextToLastWindow, TextOutputMode, typeToLastWindow } from "./text-handler";
import { ContextCaptureService } from "./context-capture";
import { GhostTextOverlay } from "./ghost-overlay";
import { KeyboardMonitor } from "./keyboard-monitor";

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let suggestionWindow: BrowserWindow | null = null;
let brainPanelWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let nextJSPort: number | null = null;
let contextCaptureService: ContextCaptureService | null = null;
let ghostOverlay: GhostTextOverlay | null = null;
let keyboardMonitor: KeyboardMonitor | null = null;

let suggestionMode: "hotkey" | "auto" = "hotkey";
let textOutputMode: TextOutputMode = "paste";
let ghostTextEnabled = false;
let clipboardWatcher: NodeJS.Timeout | null = null;
let lastClipboardContent = "";
let isInternalClipboardOp = false;

const createKeyboardMonitor = (): KeyboardMonitor => {
  const getPort = () => is.dev ? 3000 : (nextJSPort || 3000);
  
  return new KeyboardMonitor({
    debounceMs: 500,
    minContextLength: 10,
    onSuggestionReady: async (suggestion) => {
      console.log('[GhostText] Suggestion ready:', suggestion.slice(0, 30));
      await ghostOverlay?.showSuggestion(suggestion);
    },
    onClear: () => {
      ghostOverlay?.hide();
    },
    getSuggestion: async (context, signal) => {
      try {
        const response = await fetch(`http://localhost:${getPort()}/api/suggest-inline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context }),
          signal,
        });
        const data = await response.json();
        return data.suggestion || '';
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[GhostText] API error:', error);
        }
        return '';
      }
    },
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
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

const createBrainPanelWindow = () => {
  if (brainPanelWindow && !brainPanelWindow.isDestroyed()) {
    return brainPanelWindow;
  }

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  brainPanelWindow = new BrowserWindow({
    width: 320,
    height: 400,
    x: screenWidth - 340,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    show: false,
    focusable: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  if (is.dev) {
    brainPanelWindow.loadURL("http://localhost:3000/brain-panel");
  } else {
    getOrStartNextJSServer().then((port) => {
      brainPanelWindow?.loadURL(`http://localhost:${port}/brain-panel`);
    });
  }

  brainPanelWindow.webContents.once("did-finish-load", () => {
    contextCaptureService?.setRendererWindow(brainPanelWindow!);
  });

  brainPanelWindow.on("closed", () => {
    brainPanelWindow = null;
  });

  return brainPanelWindow;
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

  const iconPath = join(__dirname, "..", "..", "public", "ai-kb-logo.png");
  let trayIcon: Electron.NativeImage;
  
  trayIcon = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayIcon);
  
  tray.setToolTip('AI Keyboard Assistant');

  const updateTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Actions Menu',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Brain Panel',
        click: () => {
          if (!brainPanelWindow || brainPanelWindow.isDestroyed()) {
            const window = createBrainPanelWindow();
            window.show();
          } else if (brainPanelWindow.isVisible()) {
            brainPanelWindow.focus();
          } else {
            brainPanelWindow.show();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
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
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray?.setContextMenu(contextMenu);
  };

  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  contextCaptureService = new ContextCaptureService();
  contextCaptureService.onMemoryStored((memory) => {
    if (brainPanelWindow && !brainPanelWindow.isDestroyed()) {
      brainPanelWindow.webContents.send("memory-stored", memory);
    }
  });

  globalShortcut.register("CommandOrControl+\\", async () => {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      try {
        await captureLastActiveWindow();
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
      
      await captureLastActiveWindow();
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

  globalShortcut.register("CommandOrControl+Shift+B", () => {
    if (!brainPanelWindow || brainPanelWindow.isDestroyed()) {
      const window = createBrainPanelWindow();
      window.show();
    } else if (brainPanelWindow.isVisible()) {
      brainPanelWindow.hide();
    } else {
      brainPanelWindow.show();
    }
  });

  // Ghost Text trigger shortcut: Ctrl+Alt+G
  globalShortcut.register("CommandOrControl+Alt+G", async () => {
    console.log("[GhostText] Manual trigger via Ctrl+Alt+G");
    
    // Initialize ghost text components if needed
    if (!ghostTextEnabled) {
      ghostTextEnabled = true;
      
      if (!ghostOverlay) {
        ghostOverlay = new GhostTextOverlay();
        ghostOverlay.setPort(is.dev ? 3000 : (nextJSPort || 3000));
        ghostOverlay.create();
      }
      ghostOverlay.setEnabled(true);
      
      if (!keyboardMonitor) {
        keyboardMonitor = createKeyboardMonitor();
      }
    }
    
    // Capture selected text and trigger suggestion
    try {
      await captureLastActiveWindow();
      const selectedText = await captureSelectedText();
      
      if (selectedText.length >= 5) {
        console.log("[GhostText] Context:", selectedText.slice(0, 50));
        keyboardMonitor?.setContext(selectedText, true);
      } else {
        console.log("[GhostText] Context too short:", selectedText.length);
      }
    } catch (error) {
      console.error("[GhostText] Error capturing context:", error);
    }
  });

  // Shift+Tab to accept ghost text suggestion (avoids breaking normal Tab)
  globalShortcut.register("Shift+Tab", async () => {
    if (!ghostTextEnabled || !ghostOverlay?.isShowing()) return;
    
    const suggestion = ghostOverlay.getCurrentSuggestion();
    console.log("[GhostText] Shift+Tab - accepting suggestion:", suggestion.slice(0, 30));
    
    ghostOverlay.hide();
    keyboardMonitor?.clearBuffer();
    
    if (suggestion) {
      await sendTextToLastWindow(suggestion, textOutputMode);
      console.log("[GhostText] Suggestion inserted");
    }
  });

  // Escape key to dismiss ghost text
  globalShortcut.register("Shift+Escape", () => {
    if (!ghostTextEnabled) return;
    ghostOverlay?.hide();
  });

  ipcMain.on("replace-text", async (_, text: string) => {
    try {
      console.log("Replace text requested:", text.slice(0, 50));
      mainWindow?.hide();
      
      isInternalClipboardOp = true;
      await new Promise((r) => setTimeout(r, 100));
      await sendTextToLastWindow(text, textOutputMode);
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
      await sendTextToLastWindow(text, textOutputMode);
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

  ipcMain.handle("get-text-output-mode", () => textOutputMode);
  
  ipcMain.on("set-text-output-mode", (_, mode: TextOutputMode) => {
    console.log("[Settings] Text output mode changed to:", mode);
    textOutputMode = mode;
  });

  ipcMain.handle("get-context-capture-enabled", () => {
    return contextCaptureService?.isEnabled() ?? false;
  });

  ipcMain.on("set-context-capture-enabled", (_, enabled: boolean) => {
    contextCaptureService?.updateConfig({ enabled });
    if (brainPanelWindow && !brainPanelWindow.isDestroyed()) {
      brainPanelWindow.webContents.send("capture-status-changed", enabled);
    }
  });

  // Ghost Text Overlay handlers
  ipcMain.handle("get-ghost-text-enabled", () => ghostTextEnabled);
  
  ipcMain.on("set-ghost-text-enabled", (_, enabled: boolean) => {
    console.log("[Settings] Ghost text enabled:", enabled);
    ghostTextEnabled = enabled;
    
    if (enabled) {
      if (!ghostOverlay) {
        ghostOverlay = new GhostTextOverlay();
        ghostOverlay.setPort(is.dev ? 3000 : (nextJSPort || 3000));
        ghostOverlay.create();
      }
      ghostOverlay.setEnabled(true);
      
      if (!keyboardMonitor) {
        keyboardMonitor = createKeyboardMonitor();
      }
    } else {
      // Properly cleanup resources when disabled
      if (ghostOverlay) {
        ghostOverlay.destroy();
        ghostOverlay = null;
      }
      if (keyboardMonitor) {
        keyboardMonitor.clearBuffer();
        keyboardMonitor = null;
      }
    }
  });

  ipcMain.handle("capture-screen", async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1280, height: 720 },
      });

      if (sources.length === 0) {
        console.log("[IPC] No screen sources found");
        return null;
      }

      return sources[0].thumbnail.toDataURL();
    } catch (error) {
      console.error("[IPC] Screenshot capture failed:", error);
      return null;
    }
  });

  ipcMain.on("toggle-brain-panel", () => {
    if (brainPanelWindow?.isVisible()) {
      brainPanelWindow.hide();
    } else {
      const window = createBrainPanelWindow();
      window.show();
    }
  });

  ipcMain.on("set-brain-panel-collapsed", (_, collapsed: boolean) => {
    if (brainPanelWindow) {
      const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
      if (collapsed) {
        brainPanelWindow.setBounds({ width: 60, height: 60, x: screenWidth - 80, y: 20 });
      } else {
        brainPanelWindow.setBounds({ width: 320, height: 400, x: screenWidth - 340, y: 20 });
      }
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

  ipcMain.on("open-external", (_, url: string) => {
    shell.openExternal(url);
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
  tray?.destroy();
});

app.on("window-all-closed", () => {

});
