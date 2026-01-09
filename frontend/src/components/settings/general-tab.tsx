"use client";

import { useState, useEffect } from "react";
import { Check, Hand, Keyboard, Power, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function GeneralTab() {
  const [suggestionMode, setSuggestionMode] = useState<"hotkey" | "auto">("hotkey");

  useEffect(() => {
    window.electron?.getSuggestionMode?.().then((mode) => {
      if (mode) setSuggestionMode(mode);
    });
  }, []);

  const handleModeChange = (mode: "hotkey" | "auto") => {
    setSuggestionMode(mode);
    window.electron?.setSuggestionMode?.(mode);
  };

  return (
    <div className="p-8 w-full max-w-none space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Hand className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Accessibility Permissions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permissions granted. AI Keyboard can now access text in other applications.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <Check className="w-4 h-4" />
            Enabled
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Keyboard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">AI Keyboard Shortcut</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Press to open the AI action menu from anywhere.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md border text-sm font-medium">
            <span className="text-muted-foreground">Ctrl</span>
            <span>+</span>
            <span>\</span>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">AI Suggestions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {suggestionMode === "hotkey" 
                  ? <>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Space</kbd> to get suggestions.</>
                  : "Suggestions appear automatically when you copy text (Ctrl+C)."
                }
              </p>
            </div>
          </div>
          <Select value={suggestionMode} onValueChange={(v) => handleModeChange(v as "hotkey" | "auto")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hotkey">Hotkey only</SelectItem>
              <SelectItem value="auto">Auto-suggest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Power className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Launch at login</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, AI Keyboard will start automatically when you log in.
              </p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </section>
    </div>
  );
}
