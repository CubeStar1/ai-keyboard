import { streamText } from "ai";
import { myProvider } from "@/lib/ai";
import { defaultModel } from "@/lib/ai/models";

const SYSTEM_PROMPT = `You are an inline text completion assistant. 
Given the user's text context, repeat their text and provide a natural continuation.
- ALWAYS start with the user's exact text, then add your completion
- Keep the total output to 1-3 sentences maximum
- Match the tone and style of the input
- Return ONLY the text (original + completion), no explanations or quotes
- Do not add double quotes around the output, as this ensures the text remains clean and easy to read without unnecessary punctuation. Just present the content directly and clearly.
`;

export async function POST(req: Request) {
  const { context, model } = await req.json();

  if (!context || context.length < 5) {
    return new Response("Context too short", { status: 400 });
  }

  const result = streamText({
    model: myProvider.languageModel(model || defaultModel),
    system: SYSTEM_PROMPT,
    prompt: `Complete this text naturally. Start with the user's text, then add your continuation:\n\n"${context}"`,
  });

  return result.toTextStreamResponse();
}