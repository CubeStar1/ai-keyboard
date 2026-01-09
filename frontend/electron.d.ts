declare global {
  interface Window {
    electron: {
      onShowMenu: (callback: (text: string) => void) => void;
      replaceText: (text: string) => void;
      closeMenu: () => void;
      resizeWindow: (size: { width?: number; height?: number }) => void;
      moveWindow: (delta: { x: number; y: number }) => void;
      openSettings: () => void;
    };
  }
}

export {};

