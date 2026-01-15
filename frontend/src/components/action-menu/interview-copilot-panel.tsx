"use client";

import React, { useState, useEffect, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ArrowLeft, X, Target, Camera, RefreshCw, Lightbulb, Code, FileText, FlaskConical, Brain, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageResponse, Message, MessageContent } from "@/components/ai-elements/message";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { InterviewPromptInput } from "./interview-prompt-input";
import { InterviewHistory } from "./interview-history";
import { generateUUID } from "@/lib/utils/generate-uuid";
import { InterviewSession, InterviewMessage, InterviewAnalysis } from "@/lib/ai/types";
import {
  getInterviewSessions,
  getInterviewSessionMessages,
  deleteInterviewSession,
} from "@/actions/interview-copilot";
import {
  IdeaLoading,
  CodeLoading,
  WalkthroughLoading,
  TestCasesLoading,
  MemoriesLoading,
  AnalyzingLoading,
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
  })).optional(),
});

interface InterviewCopilotPanelProps {
  onBack: () => void;
  onClose: () => void;
}

const TABS = [
  { id: "chat", label: "Chat", shortcut: "1", Icon: MessageSquare },
  { id: "idea", label: "Idea", shortcut: "2", Icon: Lightbulb },
  { id: "code", label: "Code", shortcut: "3", Icon: Code },
  { id: "walkthrough", label: "Walkthrough", shortcut: "4", Icon: FileText },
  { id: "testcases", label: "Test Cases", shortcut: "5", Icon: FlaskConical },
  { id: "memories", label: "Memories", shortcut: "6", Icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function InterviewCopilotPanel({ onBack, onClose }: InterviewCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => generateUUID());
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getInterviewSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }, []);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const data = await getInterviewSessionMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  const activeSessionIdRef = React.useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  const pendingAssistantIdRef = React.useRef<string | null>(null);

  const { object, submit, isLoading: isStreaming } = useObject({
    api: "/api/interview-copilot",
    schema: analysisSchema,
    onError: (error: unknown) => {
      console.error("Interview Copilot error:", error);
    },
    onFinish: (event) => {
      loadSessions();
      if (pendingAssistantIdRef.current && event.object) {
        const assistantMessage: InterviewMessage = {
          id: pendingAssistantIdRef.current,
          session_id: activeSessionIdRef.current,
          role: "assistant",
          content: "Analysis complete",
          analysis: event.object as InterviewAnalysis,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        pendingAssistantIdRef.current = null;
      }
    },
  });

  const isLoading = isStreaming || isCapturing;

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSwitchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    await loadSessionMessages(sessionId);
  }, [loadSessionMessages]);

  const handleNewSession = useCallback(() => {
    const newId = generateUUID();
    setActiveSessionId(newId);
    setMessages([]);
  }, []);

  const handleDeleteSession = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteInterviewSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewSession();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }, [activeSessionId, handleNewSession]);

  const submitWithPersistence = useCallback((context: string, screenshot?: string) => {
    const messageId = generateUUID();
    const assistantMessageId = generateUUID();
    
    const userMessage: InterviewMessage = {
      id: messageId,
      session_id: activeSessionId,
      role: "user",
      content: context,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    pendingAssistantIdRef.current = assistantMessageId;
    
    const history = messages.map(m => ({
      role: m.role,
      content: m.role === 'user' ? m.content : JSON.stringify(m.analysis || {}),
    }));
    
    submit({
      context,
      screenshot,
      sessionId: activeSessionId,
      messageId,
      assistantMessageId,
      history,
    });
  }, [submit, activeSessionId, messages]);

  const handleAnalyze = useCallback(async () => {
    setIsCapturing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenshot = await (window.electron as any)?.captureScreen?.();
      submitWithPersistence("Analyze this coding problem. Provide Idea, Code, Walkthrough, and Test Cases.", screenshot);
    } catch (error) {
      console.error("Capture error:", error);
    }
    setIsCapturing(false);
  }, [submitWithPersistence]);

  const handleUpdate = useCallback(async () => {
    setIsCapturing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenshot = await (window.electron as any)?.captureScreen?.();
      submitWithPersistence("The interviewer added new constraints. Update the analysis for all sections.", screenshot);
    } catch (error) {
      console.error("Capture error:", error);
    }
    setIsCapturing(false);
  }, [submitWithPersistence]);

  const handleCodeSuggestion = useCallback(async () => {
    setIsCapturing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenshot = await (window.electron as any)?.captureScreen?.();
      submitWithPersistence("Suggest improvements to the current code approach. Focus on optimization and clean code.", screenshot);
    } catch (error) {
      console.error("Capture error:", error);
    }
    setIsCapturing(false);
  }, [submitWithPersistence]);

  const handleCustomPrompt = useCallback(async (prompt: string) => {
    setIsCapturing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenshot = await (window.electron as any)?.captureScreen?.();
      submitWithPersistence(prompt, screenshot);
    } catch (error) {
      console.error("Capture error:", error);
    }
    setIsCapturing(false);
  }, [submitWithPersistence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= "1" && e.key <= "6") {
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

  const getCurrentAnalysis = (): InterviewAnalysis | null => {
    if (object) return object as InterviewAnalysis;
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    return lastAssistantMsg?.analysis || null;
  };

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
    const analysis = getCurrentAnalysis();
    
    if (!analysis && messages.length === 0 && !isStreaming) {
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

    if (activeTab === "chat") {
      const formatAnalysis = (a: InterviewAnalysis | undefined) => {
        if (!a) return "Analysis complete";
        const parts: string[] = [];
        if (a.idea) parts.push(`## 💡 Idea\n\n${a.idea}`);
        if (a.code) parts.push(`## 💻 Code\n\n${a.code}`);
        if (a.walkthrough) parts.push(`## 📝 Walkthrough\n\n${a.walkthrough}`);
        if (a.testCases?.length) {
          const header = "| Input | Output | Reason |\n|---|---|---|\n";
          const rows = a.testCases.map(tc => `| \`${tc?.input}\` | \`${tc?.output}\` | ${tc?.reason} |`).join("\n");
          parts.push(`## 🧪 Test Cases\n\n${header}${rows}`);
        }
        return parts.join("\n\n---\n\n") || "Analysis complete";
      };

      return (
        <Conversation>
          <ConversationContent>
            {messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  {msg.role === "user" ? (
                    <p className="text-sm text-muted-foreground italic">{msg.content}</p>
                  ) : (
                    <MessageResponse>{formatAnalysis(msg.analysis)}</MessageResponse>
                  )}
                </MessageContent>
              </Message>
            ))}
            {isStreaming && analysis && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse>{formatAnalysis(analysis)}</MessageResponse>
                </MessageContent>
              </Message>
            )}
            {isStreaming && !analysis && (
              <div className="flex items-center justify-center py-4">
                <AnalyzingLoading isCapturing={isCapturing} />
              </div>
            )}
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No messages yet</p>
              </div>
            )}
          </ConversationContent>
        </Conversation>
      );
    }

    if (activeTab === "memories") {
      const allMemories = [...messages, ...(analysis ? [{ analysis }] : [])]
        .flatMap(m => ('analysis' in m ? m.analysis?.memories : undefined) || [])
        .filter(Boolean);
      
      if (allMemories.length === 0) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
            <Target className="mb-4 h-10 w-10 opacity-40" />
            <p className="text-sm">No memories found.</p>
          </div>
        );
      }
      
      return (
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {allMemories.map((mem, i) => (
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

    const hasTabContent = (() => {
      if (!analysis) return false;
      switch (activeTab) {
        case "idea":
          return !!analysis.idea;
        case "code":
          return !!analysis.code;
        case "walkthrough":
          return !!analysis.walkthrough;
        case "testcases":
          return analysis.testCases && analysis.testCases.length > 0;
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
          return analysis!.idea;
        case "code":
          return analysis!.code;
        case "walkthrough":
          return analysis!.walkthrough;
        case "testcases":
          if (analysis!.testCases?.length) {
            const header = "| Input | Output | Reason |\n|---|---|---|\n";
            const rows = analysis!.testCases.map(tc => `| \`${tc?.input}\` | \`${tc?.output}\` | ${tc?.reason} |`).join("\n");
            return header + rows;
          }
          return "";
        default:
          return "";
      }
    })();

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
            disabled={isLoading || !getCurrentAnalysis()}
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
          <InterviewHistory
            sessions={sessions}
            onSelect={handleSwitchSession}
            onDelete={handleDeleteSession}
            disabled={isLoading}
          />
          <Button variant="ghost" size="icon-sm" onClick={handleNewSession} disabled={isLoading}>
            <Plus className="h-4 w-4" />
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
        {isLoading && !getCurrentAnalysis() ? (
          <div className="flex flex-1 items-center justify-center">
            <AnalyzingLoading isCapturing={isCapturing} />
          </div>
        ) : (
          renderContent()
        )}

        {isLoading && getCurrentAnalysis() && (
          <div className="px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground border-t bg-muted/20">
            <div className="relative h-3 w-3">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              <div className="absolute inset-0.5 rounded-full bg-primary" />
            </div>
            <span className="animate-pulse">Streaming response...</span>
          </div>
        )}
      </div>

      <InterviewPromptInput
        onSubmit={handleCustomPrompt}
        disabled={isLoading}
        placeholder="Type a custom prompt..."
      />

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
          <Kbd>Ctrl+1-6</Kbd>
          <span>tabs</span>
        </div>
      </div>
    </div>
  );
}
