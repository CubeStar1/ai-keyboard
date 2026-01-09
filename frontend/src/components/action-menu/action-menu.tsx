"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { ACTIONS, Action, ActionType } from "@/lib/ai/types";
import { ActionList } from "./action-list";
import { TextPreview } from "./text-preview";
import { ResultPanel } from "./result-panel";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Search } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const { completion, complete, isLoading, setCompletion } = useCompletion({
    api: "/api/completion",
    streamProtocol: "text",
    onError: (error) => {
      console.error("Completion error:", error);
    },
  });

  const filteredActions = ACTIONS.filter((action) =>
    action.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleActionSelect = useCallback(
    async (action: Action) => {
      if (action.id === "custom") {
        setShowCustomInput(true);
        return;
      }

      setCurrentAction(action);
      setCompletion("");
      await complete(selectedText, {
        body: { action: action.id as ActionType },
      });
    },
    [complete, selectedText, setCompletion]
  );

  const handleCustomSubmit = useCallback(async () => {
    const action = ACTIONS.find((a) => a.id === "custom")!;
    setCurrentAction(action);
    setShowCustomInput(false);
    setCompletion("");
    await complete(selectedText, {
      body: { action: "custom" as ActionType, customPrompt },
    });
  }, [complete, customPrompt, selectedText, setCompletion]);

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
    setCompletion("");
    setShowCustomInput(false);
  }, [setCompletion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    currentAction,
    showCustomInput,
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

  if (currentAction) {
    return (
      <ResultPanel
        actionLabel={currentAction.label}
        result={completion}
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
        <TextPreview text={selectedText} />
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
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Start typing..."
          className="border-0 p-0 text-sm focus-visible:ring-0"
        />
      </div>

      <TextPreview text={selectedText} />

      <div className="flex-1 overflow-auto">
        <ActionList
          actions={filteredActions}
          selectedIndex={selectedIndex}
          onSelect={handleActionSelect}
          filter={filter}
        />
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Kbd>esc</Kbd>
          <span>close</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </span>
          <div className="flex items-center gap-2">
            <Kbd>↵</Kbd>
            <span>select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
