"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMessages } from "../chat/chat-messages";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ArrowLeft, X, MessageSquare, History, Plus, Trash2 } from "lucide-react";
import { generateUUID } from "@/lib/utils/generate-uuid";
import {
  getConversations,
  getConversationMessages,
  deleteConversation,
} from "@/actions/chat";
import { Conversation as ConversationType } from "@/lib/ai/types";
import { defaultModel, models } from "@/lib/ai/models";
import { ModelSelector } from "@/components/chat/model-selector";

interface ChatPanelProps {
  selectedText?: string;
  onBack: () => void;
  onClose: () => void;
}

export function ChatPanel({ selectedText, onBack, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
  const [activeChatId, setActiveChatId] = useState<string>(() => generateUUID());
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, status, sendMessage, setMessages } = useChat({
    generateId: () => generateUUID(),
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: () => {
      loadConversations();
    },
  });

  const loadConversations = useCallback(async () => {
    try {
      const convs = await getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSwitchChat = useCallback(
    async (conversationId: string) => {
      setActiveChatId(conversationId);
      try {
        const msgs = await getConversationMessages(conversationId);
        setMessages(msgs);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    },
    [setMessages]
  );

  const handleNewChat = useCallback(() => {
    const newId = generateUUID();
    setActiveChatId(newId);
    setMessages([]);
  }, [setMessages]);

  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, conversationId: string) => {
      e.stopPropagation();
      try {
        await deleteConversation(conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeChatId === conversationId) {
          handleNewChat();
        }
      } catch (error) {
        console.error("Error deleting conversation:", error);
      }
    },
    [activeChatId, handleNewChat]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handlePromptSubmit = useCallback(
    (promptMessage: PromptInputMessage) => {
      const text = input.trim();
      if (!text) return;

      sendMessage(
        { parts: [{ type: "text", text }] },
        {
          body: {
            model: selectedModel,
            conversationId: activeChatId,
          },
        }
      );
      setInput("");
    },
    [input, sendMessage, activeChatId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const isLoading = status === "streaming" || status === "submitted";
  const isDisabled = isLoading;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Chat Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <History className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
              {conversations.map((conv) => (
                <DropdownMenuItem
                  key={conv.id}
                  onClick={() => handleSwitchChat(conv.id)}
                  className="flex justify-between items-center group cursor-pointer"
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    onClick={(e) => handleDeleteChat(e, conv.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </DropdownMenuItem>
              ))}
              {conversations.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">No history</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto flex min-w-0 max-w-full flex-col gap-4 px-4 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquare className="mb-4 h-12 w-12 opacity-50" />
              <h3 className="font-medium">Start a conversation</h3>
              <p className="mt-1 text-sm">
                Ask me anything or let me help with your text
              </p>
            </div>
          )}
          <ChatMessages isLoading={isLoading} messages={messages} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput
          onSubmit={handlePromptSubmit}
          className="border-border w-full"
        >
          <PromptInputBody>
            <PromptInputTextarea
              onChange={handleInputChange}
              ref={textareaRef}
              value={input}
              placeholder="Type a message..."
              name="message"
              disabled={isDisabled}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <ModelSelector
              selectedModelId={selectedModel}
              onModelChange={setSelectedModel}
              className="mr-2"
            />
            <div className="flex-1" />
            <PromptInputSubmit
              disabled={!input.trim() || isLoading}
              status={isLoading ? "streaming" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Kbd>esc</Kbd>
          <span>back</span>
        </div>
        <div className="flex items-center gap-2">
          <Kbd>↵</Kbd>
          <span>send</span>
        </div>
      </div>
    </div>
  );
}
