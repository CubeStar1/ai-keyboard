import {
  UIMessage,
  streamText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
} from "ai";
import { myProvider } from "@/lib/ai";
import { ActionType } from "@/lib/ai/types";
import { tavilySearchTool } from "@/lib/ai/tools/tavily-search";
import {
  addMemoryTool,
  searchMemoryTool,
  getAllMemoriesTool,
} from "@/lib/ai/tools/memory";
import { generateUUID } from "@/lib/utils/generate-uuid";

const MEMORY_INSTRUCTIONS = `

## MEMORY SYSTEM (MANDATORY)

User ID: "user-1"

### BEFORE TRANSFORMING TEXT:
**You MUST call searchMemory first** to get user context.
Call: searchMemory({ query: "<relevant keywords from text>", userId: "user-1", limit: 5 })

Use memory context to personalize your response:
- User's name, role, profession
- Writing preferences and style
- Projects and technologies they work with
- Any stored preferences

### AFTER TRANSFORMING TEXT:
If the text contains new personal facts about the user, **call addMemory** to store them.
Call: addMemory({ messages: [{ role: "user", content: "<fact to store>" }], userId: "user-1" })

ALWAYS search memory before responding. This is NOT optional.
`;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, action, customPrompt } = body as {
    messages: UIMessage[];
    action: ActionType;
    customPrompt?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response("Missing messages", { status: 400 });
  }

  console.log("API received:", { action, customPrompt: customPrompt?.slice(0, 50) });

  const basePrompt = customPrompt || "You are a helpful writing assistant. Transform the text as requested. Return ONLY the transformed text, no explanations.";
  const systemPrompt = basePrompt + MEMORY_INSTRUCTIONS;

  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream({
    generateId: generateUUID,
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: myProvider.languageModel("gpt-4o-mini"),
        system: systemPrompt,
        messages: modelMessages,
        tools: {
          tavilySearchTool,
          addMemory: addMemoryTool,
          searchMemory: searchMemoryTool,
          getAllMemories: getAllMemoriesTool,
        },
        stopWhen: stepCountIs(20),
        onError: (error) => {
          console.error("Completion stream error:", error);
        },
      });

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );
    },
  });

  return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
}
