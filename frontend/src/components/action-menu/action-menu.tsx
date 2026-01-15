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
import { InterviewCopilotPanel } from "./interview-copilot-panel";
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
  const [showCopilotMode, setShowCopilotMode] = useState(false);
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

      if (action.id === "interview-copilot") {
        setShowCopilotMode(true);
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
    setShowCopilotMode(false);
  }, [setMessages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showChatMode || showCopilotMode) return;

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

      if (e.key === "Tab") {
        e.preventDefault();
        const chatAction = allActions.find(a => a.id === "chat");
        if (chatAction) {
          handleActionSelect(chatAction);
        }
        return;
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

  if (showCopilotMode) {
    return (
      <InterviewCopilotPanel
        onBack={handleBack}
        onClose={onClose}
      />
    );
  }

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
      <div className="px-2 pt-2 pb-1">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.06] dark:border-white/[0.06]">
          <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search for actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-muted-foreground/50">Quick AI</span>
            <Kbd className="text-[10px] px-1.5 py-0.5 bg-white/[0.08] border-white/[0.1]">Tab</Kbd>
          </div>
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
