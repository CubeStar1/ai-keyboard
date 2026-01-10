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
    };
  }
}

export {};
