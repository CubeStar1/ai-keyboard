"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { MessageResponse } from "@/components/ai-elements/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Copy, X } from "lucide-react";

interface ResultPanelProps {
  actionLabel: string;
  result: string;
  isLoading: boolean;
  onBack: () => void;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function ResultPanel({
  actionLabel,
  result,
  isLoading,
  onBack,
  onClose,
  onCopy,
  onPaste,
}: ResultPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {actionLabel}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 pt-2 h-[calc(100%-6rem)]">
        {isLoading && !result ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <MessageResponse className="text-sm">{result}</MessageResponse>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Kbd>esc</Kbd>
          <span>to close</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onCopy}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
            <span>copy</span>
          </button>
          <button
            onClick={onPaste}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <Kbd>↵</Kbd>
            <span>to paste</span>
          </button>
        </div>
      </div>
    </div>
  );
}
