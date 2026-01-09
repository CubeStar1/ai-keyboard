import { keyboard, Key } from "@nut-tree-fork/nut-js";
import { clipboard } from "electron";

keyboard.config.autoDelayMs = 50;

export async function captureSelectedText(): Promise<string> {
  const original = clipboard.readText();

  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.C);
  await keyboard.releaseKey(Key.C);
  await keyboard.releaseKey(Key.LeftControl);

  await new Promise((r) => setTimeout(r, 150));

  const selected = clipboard.readText();
  clipboard.writeText(original);

  return selected;
}

export async function pasteToLastWindow(text: string): Promise<void> {
  clipboard.writeText(text);
  
  // Use Alt+Tab to switch back to previous window
  await keyboard.pressKey(Key.LeftAlt);
  await keyboard.pressKey(Key.Tab);
  await keyboard.releaseKey(Key.Tab);
  await keyboard.releaseKey(Key.LeftAlt);
  
  // Wait for window switch
  await new Promise((r) => setTimeout(r, 150));
  
  // Now paste
  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.V);
  await keyboard.releaseKey(Key.V);
  await keyboard.releaseKey(Key.LeftControl);
  
  console.log("Pasted to previous window");
}
