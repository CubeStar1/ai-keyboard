import {
  UIMessage,
  streamText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  generateId,
} from "ai";
import { myProvider } from "@/lib/ai";
import { getMCPTools } from "@/lib/ai";
import { tavilySearchTool } from "@/lib/ai/tools/tavily-search";
import {
  addMemoryTool,
  searchMemoryTool,
  getAllMemoriesTool,
} from "@/lib/ai/tools/memory";
import { generateUUID } from "@/lib/utils/generate-uuid";
import {
  saveChat,
  saveMessages,
  getChatById,
  generateTitleFromUserMessage,
} from "@/actions/chat";
import { defaultModel } from "@/lib/ai/models";


const SYSTEM_PROMPT = `You are a helpful AI assistant integrated into a keyboard/text editing assistant. 
You help users with their writing, answer questions, and assist with various tasks.

When the user shares text with you, help them improve, understand, or work with that text.
Be concise but helpful in your responses.

## Memory System
You have access to a persistent memory system. Always use "user-1" as the userId for memory operations.

**When to store memories (addMemory):**
- When the user shares personal preferences, facts about themselves, or important context
- When the user explicitly asks you to remember something
- After learning something important about the user that would be useful in future conversations

**When to search memories (searchMemory):**
- At the start of conversations to recall relevant context about the user
- When the user asks "do you remember..." or refers to past conversations
- When you need context about user preferences or past information

**When to get all memories (getAllMemories):**
- When the user asks what you know about them
- When you need a complete overview of stored information

## Other Tools
- Search the web for current information using tavilySearchTool
- Perform various system operations via MCP tools

Use tools when they would genuinely help answer the user's question.
Always explain what you're doing when using tools.`;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, conversationId, model } = body as {
    messages: UIMessage[];
    conversationId?: string;
    model?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response("Missing messages", { status: 400 });
  }

  // const mcpTools = await getMCPTools();
  const modelMessages = await convertToModelMessages(messages);

  const userMessage = messages[messages.length - 1];

  if (conversationId && userMessage) {
    const existingChat = await getChatById(conversationId);

    if (!existingChat) {
      const title = await generateTitleFromUserMessage(userMessage, model || defaultModel);
      await saveChat({ id: conversationId, title });
    }

    await saveMessages([userMessage], conversationId);
  }

  const stream = createUIMessageStream({
    generateId: generateUUID,
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: myProvider.languageModel(model || defaultModel),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: {
          tavilySearchTool,
          addMemory: addMemoryTool,
          searchMemory: searchMemoryTool,
          getAllMemories: getAllMemoriesTool,
          // ...mcpTools,
        },
        stopWhen: stepCountIs(20),
        onError: (error) => {
          console.error("Chat stream error:", error);
        },
      });

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );
    },
    onFinish: async ({ messages: generatedMessages }) => {
      if (conversationId && generatedMessages && generatedMessages.length > 0) {
        await saveMessages(generatedMessages as UIMessage[], conversationId);
      }
    },
  });

  return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
}

