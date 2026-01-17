declare global {
  interface Window {
    electron: {
      onShowMenu: (callback: (text: string) => void) => () => void;
      replaceText: (text: string) => void;
      closeMenu: () => void;
      resizeWindow: (size: { width?: number; height?: number }) => void;
      moveWindow: (delta: { x: number; y: number }) => void;
      openSettings: () => void;
      onShowSuggestion: (callback: (data: { context: string }) => void) => () => void;
      acceptSuggestion: (text: string) => void;
      dismissSuggestion: () => void;
      getSuggestionMode: () => Promise<"hotkey" | "auto">;
      setSuggestionMode: (mode: "hotkey" | "auto") => void;
      getTextOutputMode: () => Promise<"paste" | "typewriter">;
      setTextOutputMode: (mode: "paste" | "typewriter") => void;
      toggleBrainPanel: () => void;
      setBrainPanelCollapsed: (collapsed: boolean) => void;
      onMemoryStored: (callback: (memory: string) => void) => () => void;
      onCaptureStatusChanged: (callback: (enabled: boolean) => void) => () => void;
      getContextCaptureEnabled: () => Promise<boolean>;
      setContextCaptureEnabled: (enabled: boolean) => void;
      onAnalyzeScreenshot: (callback: (data: { dataUrl: string; timestamp: string }) => void) => () => void;
      captureScreen: () => Promise<string | null>;
      openExternal: (url: string) => void;
      notifyAnalysisComplete: (success: boolean) => void;
      // Ghost Text Overlay
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
      getGhostTextEnabled: () => Promise<boolean>;
      setGhostTextEnabled: (enabled: boolean) => void;
    };
  }
}

export {};

