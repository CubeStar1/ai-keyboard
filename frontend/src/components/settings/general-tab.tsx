"use client";

import { useState, useEffect } from "react";
import { Check, Clock, Hand, Keyboard, Power, Sparkles, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const STORAGE_KEYS = {
  SUGGESTION_MODE: "ai-keyboard-suggestion-mode",
  TEXT_OUTPUT_MODE: "ai-keyboard-text-output-mode",
  GHOST_TEXT_ENABLED: "ai-keyboard-ghost-text-enabled",
  GHOST_TEXT_AUTO_TRIGGER: "ai-keyboard-ghost-text-auto-trigger",
  GHOST_TEXT_AUTO_TRIGGER_DELAY: "ai-keyboard-ghost-text-auto-trigger-delay",
};

export function GeneralTab() {
  const [suggestionMode, setSuggestionMode] = useState<"hotkey" | "auto">("hotkey");
  const [textOutputMode, setTextOutputMode] = useState<"paste" | "typewriter">("paste");
  const [ghostTextEnabled, setGhostTextEnabled] = useState(false);
  const [ghostTextAutoTrigger, setGhostTextAutoTrigger] = useState(false);
  const [ghostTextAutoTriggerDelay, setGhostTextAutoTriggerDelay] = useState(3); // seconds

  useEffect(() => {
    const storedSuggestionMode = localStorage.getItem(STORAGE_KEYS.SUGGESTION_MODE) as "hotkey" | "auto" | null;
    const storedTextOutputMode = localStorage.getItem(STORAGE_KEYS.TEXT_OUTPUT_MODE) as "paste" | "typewriter" | null;
    const storedGhostText = localStorage.getItem(STORAGE_KEYS.GHOST_TEXT_ENABLED);
    
    if (storedSuggestionMode) {
      setSuggestionMode(storedSuggestionMode);
      window.electron?.setSuggestionMode?.(storedSuggestionMode);
    }
    
    if (storedTextOutputMode) {
      setTextOutputMode(storedTextOutputMode);
      window.electron?.setTextOutputMode?.(storedTextOutputMode);
    }

    if (storedGhostText) {
      const enabled = storedGhostText === "true";
      setGhostTextEnabled(enabled);
      window.electron?.setGhostTextEnabled?.(enabled);
    }

    // Load auto-trigger settings
    const storedAutoTrigger = localStorage.getItem(STORAGE_KEYS.GHOST_TEXT_AUTO_TRIGGER);
    const storedAutoTriggerDelay = localStorage.getItem(STORAGE_KEYS.GHOST_TEXT_AUTO_TRIGGER_DELAY);
    
    if (storedAutoTrigger) {
      const enabled = storedAutoTrigger === "true";
      setGhostTextAutoTrigger(enabled);
      window.electron?.setGhostTextAutoTrigger?.(enabled);
    }
    
    if (storedAutoTriggerDelay) {
      const delay = parseInt(storedAutoTriggerDelay, 10);
      setGhostTextAutoTriggerDelay(delay);
      window.electron?.setGhostTextAutoTriggerDelay?.(delay * 1000); // Convert to ms
    }
  }, []);

  const handleModeChange = (mode: "hotkey" | "auto") => {
    setSuggestionMode(mode);
    localStorage.setItem(STORAGE_KEYS.SUGGESTION_MODE, mode);
    window.electron?.setSuggestionMode?.(mode);
  };

  const handleTextOutputModeChange = (mode: "paste" | "typewriter") => {
    setTextOutputMode(mode);
    localStorage.setItem(STORAGE_KEYS.TEXT_OUTPUT_MODE, mode);
    window.electron?.setTextOutputMode?.(mode);
  };

  const handleGhostTextChange = (enabled: boolean) => {
    setGhostTextEnabled(enabled);
    localStorage.setItem(STORAGE_KEYS.GHOST_TEXT_ENABLED, String(enabled));
    window.electron?.setGhostTextEnabled?.(enabled);
  };

  const handleAutoTriggerChange = (enabled: boolean) => {
    setGhostTextAutoTrigger(enabled);
    localStorage.setItem(STORAGE_KEYS.GHOST_TEXT_AUTO_TRIGGER, String(enabled));
    window.electron?.setGhostTextAutoTrigger?.(enabled);
  };

  const handleAutoTriggerDelayChange = (value: number[]) => {
    const delay = value[0];
    setGhostTextAutoTriggerDelay(delay);
    localStorage.setItem(STORAGE_KEYS.GHOST_TEXT_AUTO_TRIGGER_DELAY, String(delay));
    window.electron?.setGhostTextAutoTriggerDelay?.(delay * 1000); // Convert to ms
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
              <Type className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Text Output Mode</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {textOutputMode === "paste" 
                  ? "Text is pasted instantly from clipboard."
                  : "Text is typed character by character for a cool effect."
                }
              </p>
            </div>
          </div>
          <Select value={textOutputMode} onValueChange={(v) => handleTextOutputModeChange(v as "paste" | "typewriter")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paste">Instant paste</SelectItem>
              <SelectItem value="typewriter">Typewriter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Sparkles className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Ghost Text Autocomplete</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {ghostTextEnabled 
                  ? "AI suggestions appear inline as you type in any application."
                  : "Enable to see inline AI suggestions across all Windows apps."
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Alt+G</kbd> to trigger manually
              </p>
            </div>
          </div>
          <Switch 
            checked={ghostTextEnabled} 
            onCheckedChange={handleGhostTextChange}
          />
        </div>

        {/* Auto-trigger options - only shown when ghost text is enabled */}
        {ghostTextEnabled && (
          <div className="ml-9 space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Auto-trigger suggestions</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Suggestions appear automatically when you pause typing
                  </p>
                </div>
              </div>
              <Switch 
                checked={ghostTextAutoTrigger} 
                onCheckedChange={handleAutoTriggerChange}
              />
            </div>

            {ghostTextAutoTrigger && (
              <div className="flex items-center gap-4 ml-7">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Auto Trigger Delay</span>
                    <span className="text-xs font-medium">{ghostTextAutoTriggerDelay}s</span>
                  </div>
                  <Slider
                    value={[ghostTextAutoTriggerDelay]}
                    onValueChange={handleAutoTriggerDelayChange}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Fast (1s)</span>
                    <span className="text-[10px] text-muted-foreground">Slow (10s)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
