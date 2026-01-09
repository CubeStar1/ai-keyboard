import { streamText, stepCountIs } from "ai";
import { myProvider } from "@/lib/ai";
import { ActionType } from "@/lib/ai/types";
import { getMCPTools } from "@/lib/ai";
import { tavilySearchTool } from "@/lib/ai/tools/tavily-search";

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

  const systemPrompt = customPrompt || "You are a helpful writing assistant. Transform the text as requested. Return ONLY the transformed text, no explanations.";
  
  const mcpTools = await getMCPTools();

  const result = streamText({
    model: myProvider.languageModel("gpt-4o-mini"),
    system: systemPrompt,
    prompt,
    tools: {
      tavilySearchTool,
      ...mcpTools,
    },
    stopWhen: stepCountIs(20),
  });

  return result.toTextStreamResponse();
}
