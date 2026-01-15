"use client";

import { useState, useEffect, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ArrowLeft, X, Target, Camera, RefreshCw, Lightbulb, Code, FileText, FlaskConical, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageResponse, Message, MessageContent } from "@/components/ai-elements/message";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import {
  IdeaLoading,
  CodeLoading,
  WalkthroughLoading,
  TestCasesLoading,
  AnalyzingLoading,
  MemoriesLoading,
} from "./loading-states";

const analysisSchema = z.object({
  idea: z.string().optional(),
  code: z.string().optional(),
  walkthrough: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string().optional(),
    output: z.string().optional(),
    reason: z.string().optional()
  })).optional(),
  memories: z.array(z.object({
    memory: z.string().optional(),
    createdAt: z.string().optional()
  })).optional()
});

interface InterviewCopilotPanelProps {
  onBack: () => void;
  onClose: () => void;
}

const TABS = [
  { id: "idea", label: "Idea", shortcut: "1", Icon: Lightbulb },
  { id: "code", label: "Code", shortcut: "2", Icon: Code },
  { id: "walkthrough", label: "Walkthrough", shortcut: "3", Icon: FileText },
  { id: "testcases", label: "Test Cases", shortcut: "4", Icon: FlaskConical },
  { id: "memories", label: "Memories", shortcut: "5", Icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function InterviewCopilotPanel({ onBack, onClose }: InterviewCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("idea");
  const [isCapturing, setIsCapturing] = useState(false);

  const { object, submit, isLoading: isStreaming } = useObject({
    api: "/api/interview-copilot",
    schema: analysisSchema,
    onError: (error: unknown) => {
      console.error("Interview Copilot error:", error);
    },
  });

  const isLoading = isStreaming || isCapturing;

  const handleAnalyze = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenshot = await (window.electron as any)?.captureScreen?.();
      
      submit({
        context: "Analyze this coding problem. Provide Idea, Code, Walkthrough, and Test Cases.",
        screenshot
      });
    } catch (error) {
      console.error("Capture error:", error);
    }
    
    setIsCapturing(false);
  }, [submit]);

  const handleUpdate = useCallback(() => {
    submit({
      context: "The interviewer added new constraints. Update the analysis for all sections.",
    });
  }, [submit]);

  const handleCodeSuggestion = useCallback(() => {
    submit({
      context: "Suggest improvements to the current code approach. Focus on optimization and clean code.",
    });
  }, [submit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        setActiveTab(TABS[tabIndex].id);
        return;
      }

      if (e.altKey && e.key.toLowerCase() === "x" && !e.shiftKey) {
        e.preventDefault();
        handleAnalyze();
        return;
      }

      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleUpdate();
        return;
      }

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCodeSuggestion();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze, handleUpdate, handleCodeSuggestion, onBack]);

  const renderLoadingState = () => {
    switch (activeTab) {
      case "idea":
        return <IdeaLoading />;
      case "code":
        return <CodeLoading />;
      case "walkthrough":
        return <WalkthroughLoading />;
      case "testcases":
        return <TestCasesLoading />;
      case "memories":
        return <MemoriesLoading />;
      default:
        return <AnalyzingLoading isCapturing={isCapturing} />;
    }
  };

  const renderContent = () => {
    if (!object) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
          <Target className="mb-4 h-12 w-12 opacity-50" />
          <h3 className="font-medium">Ready to Analyze</h3>
          <p className="mt-1 text-sm">
            Press <Kbd>Alt+X</Kbd> to analyze a coding problem
          </p>
        </div>
      );
    }

    const hasTabContent = (() => {
      switch (activeTab) {
        case "idea":
          return !!object.idea;
        case "code":
          return !!object.code;
        case "walkthrough":
          return !!object.walkthrough;
        case "testcases":
          return object.testCases && object.testCases.length > 0;
        case "memories":
          return object.memories && object.memories.length > 0;
        default:
          return false;
      }
    })();

    if (isStreaming && !hasTabContent) {
      return (
        <div className="flex flex-1 items-center justify-center">
          {renderLoadingState()}
        </div>
      );
    }

    if (!hasTabContent) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
          <Target className="mb-4 h-10 w-10 opacity-40" />
          <p className="text-sm">No content for this tab yet.</p>
          <p className="mt-1 text-xs">Try analyzing a problem first.</p>
        </div>
      );
    }

    const content = (() => {
      switch (activeTab) {
        case "idea":
          return object.idea;
        case "code":
          return object.code;
        case "walkthrough":
          return object.walkthrough;
        case "testcases":
           if (object.testCases?.length) {
             const header = "| Input | Output | Reason |\n|---|---|---|\n";
             const rows = object.testCases.map(tc => `| \`${tc?.input}\` | \`${tc?.output}\` | ${tc?.reason} |`).join("\n");
             return header + rows;
           }
           return "";
        case "memories":
           return null;
        default:
          return "";
      }
    })();

    if (activeTab === "memories" && object.memories?.length) {
      return (
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {object.memories.map((mem, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 bg-card/50 p-3 backdrop-blur-sm"
              >
                <p className="text-sm text-foreground">{mem?.memory}</p>
                {mem?.createdAt && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(mem.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Conversation>
        <ConversationContent>
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>{content ?? ""}</MessageResponse>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Interview Copilot</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="h-7 gap-1.5 text-xs"
          >
            <Camera className="h-3.5 w-3.5" />
            Analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpdate}
            disabled={isLoading || !object}
            className="h-7 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCodeSuggestion}
            disabled={isLoading}
            className="h-7 gap-1.5 text-xs"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Suggest
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            <Kbd className="ml-1 text-[10px]">{tab.shortcut}</Kbd>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading && !object ? (
          <div className="flex flex-1 items-center justify-center">
            <AnalyzingLoading isCapturing={isCapturing} />
          </div>
        ) : (
          renderContent()
        )}

        {isLoading && object && (
          <div className="px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground border-t bg-muted/20">
            <div className="relative h-3 w-3">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              <div className="absolute inset-0.5 rounded-full bg-primary" />
            </div>
            <span className="animate-pulse">Streaming response...</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Kbd>Alt+X</Kbd>
            <span>analyze</span>
          </div>
          <div className="flex items-center gap-1">
            <Kbd>Alt+Shift+X</Kbd>
            <span>update</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Kbd>Ctrl+1-4</Kbd>
          <span>tabs</span>
        </div>
      </div>
    </div>
  );
}
