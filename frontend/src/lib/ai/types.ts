export type ActionType =
  | "fix-grammar"
  | "shorten"
  | "expand"
  | "professional-tone"
  | "casual-tone"
  | "friendly-tone"
  | "email-writer"
  | "custom"
  | "chat";

export interface Action {
  id: ActionType;
  label: string;
  icon: string;
  description?: string;
}

export const ACTIONS: Action[] = [
  { id: "chat", label: "Chat Mode", icon: "💬" },
  { id: "fix-grammar", label: "Fix Grammar", icon: "✍️" },
  { id: "shorten", label: "Shorten Text", icon: "✂️" },
  { id: "expand", label: "Make Longer", icon: "📝" },
  { id: "professional-tone", label: "Professional Tone", icon: "💼" },
  { id: "casual-tone", label: "Casual Tone", icon: "😊" },
  { id: "friendly-tone", label: "Friendly Tone", icon: "🤝" },
  { id: "email-writer", label: "Write Email", icon: "📧" },
  { id: "custom", label: "Custom Prompt", icon: "⚡" },
];

import { LanguageModelUsage } from 'ai'
import { UsageData } from 'tokenlens/helpers'

export type AppUsage = LanguageModelUsage &
  UsageData & {
    modelId?: string
    context?: {
      totalMax?: number
      combinedMax?: number
      inputMax?: number
    }
    costUSD?: {
      inputUSD?: number
      outputUSD?: number
      reasoningUSD?: number
      cacheReadUSD?: number
      totalUSD?: number
    }
  }

export interface TelemetryMetadata {
  timeToFirstToken: number | null
  tokensPerSecond: number
  duration: number
  usage?: LanguageModelUsage
  model?: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  updated_at: string
  created_at: string
  lastContext?: AppUsage
}

export interface Message {
  id: string
  role: string
  parts: unknown[]
  created_at: string
  metadata?: TelemetryMetadata
}

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  raw_content?: string
}

export interface TavilySearchResponse {
  answer?: string
  query: string
  response_time: number
  results: TavilySearchResult[]
  images?: { url: string; description: string }[]
}
