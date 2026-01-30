import { registerTextHandlers } from "./text-handlers";
import { registerSettingsHandlers } from "./settings-handlers";
import { registerWindowHandlers } from "./window-handlers";
import { registerCaptureHandlers } from "./capture-handlers";

export const registerAllIpcHandlers = (): void => {
  registerTextHandlers();
  registerSettingsHandlers();
  registerWindowHandlers();
  registerCaptureHandlers();
};

export { registerTextHandlers } from "./text-handlers";
export { registerSettingsHandlers } from "./settings-handlers";
export { registerWindowHandlers } from "./window-handlers";
export { registerCaptureHandlers } from "./capture-handlers";
