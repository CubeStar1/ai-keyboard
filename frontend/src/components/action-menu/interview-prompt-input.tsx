"use client";

import { useState, useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewPromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const InterviewPromptInput = forwardRef<HTMLTextAreaElement, InterviewPromptInputProps>(
  ({ onSubmit, disabled, placeholder = "Type a custom prompt...", className }, ref) => {
    const [value, setValue] = useState("");
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSubmit(trimmed);
      setValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className={cn("flex items-end gap-2 border-t p-3", className)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-32 min-h-[38px]"
          )}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="h-[38px] w-[38px] shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

InterviewPromptInput.displayName = "InterviewPromptInput";
