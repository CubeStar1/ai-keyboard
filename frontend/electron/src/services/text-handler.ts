import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { clipboard } from "electron";
import { windowManager } from "node-window-manager";

keyboard.config.autoDelayMs = 5;

let lastActiveWindowId: number | null = null;

export async function captureLastActiveWindow(): Promise<void> {
  try {
    const activeWindow = windowManager.getActiveWindow();
    lastActiveWindowId = activeWindow?.id ?? null;
    console.log("Captured window ID:", lastActiveWindowId);
  } catch (error) {
    console.error("Failed to capture active window:", error);
  }
}

export async function captureSelectedText(): Promise<string> {
  const original = clipboard.readText();

  // Release modifiers that might interfere (especially for Ctrl+Alt+G)
  await keyboard.releaseKey(Key.LeftAlt);
  await keyboard.releaseKey(Key.RightAlt);
  await keyboard.releaseKey(Key.LeftShift);
  await keyboard.releaseKey(Key.RightShift);
  await keyboard.releaseKey(Key.LeftControl);
  await keyboard.releaseKey(Key.RightControl);

  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.C);
  await keyboard.releaseKey(Key.C);
  await keyboard.releaseKey(Key.LeftControl);

  await new Promise((r) => setTimeout(r, 150));

  const selected = clipboard.readText();
  clipboard.writeText(original);

  return selected;
}

async function restoreFocusToLastWindow(): Promise<boolean> {
  if (lastActiveWindowId) {
    const targetWindow = windowManager
      .getWindows()
      .find((w) => w.id === lastActiveWindowId);

    if (targetWindow) {
      targetWindow.bringToTop();
      await new Promise((r) => setTimeout(r, 100));
      return true;
    }
  }
  return false;
}

export async function pasteToLastWindow(text: string): Promise<void> {
  const originalClipboard = clipboard.readText();

  try {
    await restoreFocusToLastWindow();

    // Write text to clipboard
    clipboard.writeText(text);
    await new Promise((r) => setTimeout(r, 50));

    // Paste
    await keyboard.pressKey(Key.LeftControl);
    await keyboard.pressKey(Key.V);
    await new Promise((r) => setTimeout(r, 30));
    await keyboard.releaseKey(Key.V);
    await keyboard.releaseKey(Key.LeftControl);

    await new Promise((r) => setTimeout(r, 100));

    console.log("Pasted to previous window");
  } finally {
    clipboard.writeText(originalClipboard);
  }
}

export async function typeToLastWindow(text: string): Promise<void> {
  await restoreFocusToLastWindow();
  await keyboard.type(text);
  console.log("Typed to previous window");
}

export type TextOutputMode = "paste" | "typewriter";

export async function sendTextToLastWindow(
  text: string,
  mode: TextOutputMode = "paste"
): Promise<void> {
  if (mode === "typewriter") {
    await typeToLastWindow(text);
  } else {
    await pasteToLastWindow(text);
  }
}
