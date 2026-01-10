import { streamText, stepCountIs } from "ai";
import { myProvider } from "@/lib/ai";
import { ActionType } from "@/lib/ai/types";
import { getMCPTools } from "@/lib/ai";
import { tavilySearchTool } from "@/lib/ai/tools/tavily-search";
import {
  addMemoryTool,
  searchMemoryTool,
  getAllMemoriesTool,
} from "@/lib/ai/tools/memory";

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
  const { prompt, action, customPrompt } = body as {
    prompt: string;
    action: ActionType;
    customPrompt?: string;
  };

  console.log("API received:", { prompt: prompt?.slice(0, 50), action, customPrompt: customPrompt?.slice(0, 50) });

  if (!prompt || !action) {
    return new Response("Missing prompt or action", { status: 400 });
  }

  const basePrompt = customPrompt || "You are a helpful writing assistant. Transform the text as requested. Return ONLY the transformed text, no explanations.";
  const systemPrompt = basePrompt + MEMORY_INSTRUCTIONS;
  
  // const mcpTools = await getMCPTools();

  const result = streamText({
    model: myProvider.languageModel("gpt-4o-mini"),
    system: systemPrompt,
    prompt,
    tools: {
      tavilySearchTool,
      addMemory: addMemoryTool,
      searchMemory: searchMemoryTool,
      getAllMemories: getAllMemoriesTool,
      // ...mcpTools,
    },
    stopWhen: stepCountIs(20),
  });

  return result.toTextStreamResponse();
}
