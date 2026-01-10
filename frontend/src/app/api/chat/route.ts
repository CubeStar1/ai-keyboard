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


const SYSTEM_PROMPT = `You are an AI assistant integrated into an intelligent keyboard. You help users write better, answer questions, and assist with tasks.

## MEMORY SYSTEM - USE PROACTIVELY AND FREQUENTLY
User ID: "user-1" (always use this)

### ALWAYS STORE MEMORIES when the user reveals:
- Name, role, job title, company, or team
- Email preferences: signature, tone, common recipients
- Writing style: formal/casual, verbose/concise, technical level
- Tech stack, tools, programming languages they use
- Projects, tasks, or goals they're working on
- Corrections to your output (LEARN from these!)
- Preferences for AI behavior ("shorter responses", "more examples")
- Personal details: location, timezone, communication preferences
- Recurring topics or workflows

### ALWAYS SEARCH MEMORIES:
- At the START of every conversation - search for user context
- Before writing emails - search for signature, tone, recipient preferences
- Before code help - search for their tech stack
- When they reference "last time" or "before"
- When providing personalized advice

### Memory Best Practices:
- Store specific, actionable facts (NOT vague summaries)
- Include context: "User prefers 2-3 sentence responses (stated 2024-01-10)"
- Update memories when preferences change
- Search before assuming - the user may have told you before!

## OTHER TOOLS
- tavilySearchTool: Web search for current information
- MCP tools: System operations

Be concise. Personalize responses based on stored memories. Store new facts without asking.`;


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

  const mcpTools = await getMCPTools();
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
          ...mcpTools,
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

