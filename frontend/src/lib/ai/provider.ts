import { customProvider } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export function createProvider(apiKeys: { openai?: string } = {}) {
  const openai = createOpenAI({
    apiKey: apiKeys.openai || process.env.OPENAI_API_KEY,
  });

  return customProvider({
    languageModels: {
      "gpt-4o-mini": openai("gpt-4o-mini"),
      "gpt-4o": openai("gpt-4o"),
    },
    fallbackProvider: openai,
  });
}

export const myProvider = createProvider();
