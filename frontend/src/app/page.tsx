"use client";

import { useEffect, useState } from "react";
import { ActionMenu } from "@/components/action-menu";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.electron) {
      window.electron.onShowMenu((text) => {
        setSelectedText(text);
        setIsOpen(true);
      });
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedText("");
    window.electron?.closeMenu();
  };

  const handleReplace = (text: string) => {
    window.electron?.replaceText(text);
    setIsOpen(false);
    setSelectedText("");
  };

  if (!isOpen) {
    return (
      <main className="flex h-screen items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Press <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl+\</kbd></p>
          <p className="mt-2 text-xs">with text selected to activate</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden rounded-lg border bg-background shadow-2xl">
      <ActionMenu
        selectedText={selectedText}
        onClose={handleClose}
        onReplace={handleReplace}
      />
    </main>
  );
}
