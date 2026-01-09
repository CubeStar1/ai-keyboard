import { streamText, stepCountIs } from "ai";
import { myProvider } from "@/lib/ai";
import { getPromptForAction } from "@/lib/ai/prompts";
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

  console.log("API received:", { prompt: prompt?.slice(0, 50), action, customPrompt });

  if (!prompt || !action) {
    return new Response("Missing prompt or action", { status: 400 });
  }

  const systemPrompt = getPromptForAction(action, customPrompt);
  const mcpTools = await getMCPTools()

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
