"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Action, ActionType } from "@/lib/ai/types";
import { loadActions, getActionPrompt, getActionByShortcut } from "@/lib/ai/actions-store";
import { ActionList } from "./action-list";
import { ResultPanel } from "./result-panel";
import { ChatPanel } from "./chat-panel";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Search, Settings, Sun, Moon } from "lucide-react";
import { generateUUID } from "@/lib/utils/generate-uuid";

interface ActionMenuProps {
  selectedText: string;
  onClose: () => void;
  onReplace: (text: string) => void;
}

export function ActionMenu({
  selectedText,
  onClose,
  onReplace,
}: ActionMenuProps) {
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showChatMode, setShowChatMode] = useState(false);
  const [allActions, setAllActions] = useState<Action[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const { messages, status, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/completion",
    }),
    generateId: () => generateUUID(),
    onError: (error) => {
      console.error("Completion error:", error);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Extract completion text from messages
  const lastAssistantMessage = messages
    .filter(m => m.role === "assistant")
    .pop();
  const completion = lastAssistantMessage?.parts
    ?.filter(p => p.type === "text")
    .map(p => p.text)
    .join("") || "";

  useEffect(() => {
    setAllActions(loadActions());
  }, []);

  const filteredActions = allActions.filter((action) =>
    action.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleActionSelect = useCallback(
    async (action: Action) => {
      if (action.id === "chat") {
        setShowChatMode(true);
        return;
      }

      if (action.id === "custom") {
        setShowCustomInput(true);
        return;
      }

      setCurrentAction(action);
      setMessages([]);
      
      const prompt = getActionPrompt(action);
      sendMessage(
        { 
          parts: [{ 
            type: "text", 
            text: selectedText
          }] 
        },
        {
          body: { action: action.id as ActionType, customPrompt: prompt },
        }
      );
    },
    [sendMessage, selectedText, setMessages]
  );

  const handleCustomSubmit = useCallback(async () => {
    const customAction = allActions.find((a) => a.id === "custom");
    if (!customAction) return;
    
    setCurrentAction(customAction);
    setShowCustomInput(false);
    setMessages([]);
    sendMessage(
      { 
        parts: [{ 
          type: "text", 
          text: selectedText
        }] 
      },
      {
        body: { action: "custom" as ActionType, customPrompt },
      }
    );
  }, [allActions, sendMessage, customPrompt, selectedText, setMessages]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(completion);
  }, [completion]);

  const handlePaste = useCallback(() => {
    if (completion) {
      onReplace(completion);
    }
  }, [completion, onReplace]);

  const handleBack = useCallback(() => {
    setCurrentAction(null);
    setMessages([]);
    setShowCustomInput(false);
    setShowChatMode(false);
  }, [setMessages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showChatMode) return;

      if (e.key === "Escape") {
        if (currentAction || showCustomInput) {
          handleBack();
        } else {
          onClose();
        }
        return;
      }

      if (showCustomInput) {
        if (e.key === "Enter" && customPrompt.trim()) {
          handleCustomSubmit();
        }
        return;
      }

      if (currentAction) {
        if (e.key === "Enter") {
          handlePaste();
        }
        return;
      }

      if (e.altKey && e.key.length === 1) {
        const action = getActionByShortcut(allActions, e.key);
        if (action) {
          e.preventDefault();
          handleActionSelect(action);
          return;
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (e.key === "Enter" && filteredActions[selectedIndex]) {
        handleActionSelect(filteredActions[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    allActions,
    currentAction,
    showCustomInput,
    showChatMode,
    customPrompt,
    filteredActions,
    selectedIndex,
    handleActionSelect,
    handleBack,
    handleCustomSubmit,
    handlePaste,
    onClose,
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (showChatMode) {
    return (
      <ChatPanel
        selectedText={selectedText}
        onBack={handleBack}
        onClose={onClose}
      />
    );
  }

  if (currentAction) {
    return (
      <ResultPanel
        actionLabel={currentAction.label}
        messages={messages.filter(m => m.role === "assistant")}
        isLoading={isLoading}
        onBack={handleBack}
        onClose={onClose}
        onCopy={handleCopy}
        onPaste={handlePaste}
      />
    );
  }

  if (showCustomInput) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-4 p-4">
          <label className="text-sm font-medium">Enter your instruction:</label>
          <textarea
            autoFocus
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="flex-1 resize-none rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Make this sound more confident..."
          />
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Kbd>esc</Kbd>
            <span>back</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>↵</Kbd>
            <span>submit</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search actions"
            className="border-none p-0 h-auto text-sm bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <ActionList
          actions={filteredActions}
          selectedIndex={selectedIndex}
          onSelect={handleActionSelect}
          filter={filter}
        />
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Kbd>esc</Kbd>
            <span>close</span>
          </div>
          <button
            onClick={() => window.electron.openSettings()}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>settings</span>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>↵</Kbd>
            <span>select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
