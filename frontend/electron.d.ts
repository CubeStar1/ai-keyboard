declare global {
  interface Window {
    electron: {
      onShowMenu: (callback: (text: string) => void) => void;
      replaceText: (text: string) => void;
      closeMenu: () => void;
    };
  }
}

export {};
