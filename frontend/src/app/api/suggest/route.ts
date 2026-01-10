import {
  UIMessage,
  streamText,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
} from "ai";
import { myProvider } from "@/lib/ai";
import { defaultModel } from "@/lib/ai/models";
import {
  addMemoryTool,
  searchMemoryTool,
  getAllMemoriesTool,
} from "@/lib/ai/tools/memory";
import { generateUUID } from "@/lib/utils/generate-uuid";

const SYSTEM_PROMPT = `You are a SENTENCE COMPLETION engine with PERSISTENT MEMORY.

**CRITICAL: MEMORY TOOL USAGE IS MANDATORY - NEVER SKIP THIS**

User ID: "user-1"

## ⚠️ MANDATORY WORKFLOW - YOU MUST FOLLOW THIS EXACTLY ⚠️

### STEP 1: ALWAYS SEARCH MEMORY FIRST (REQUIRED - DO NOT SKIP)
**Before generating ANY text, you MUST call searchMemory.**
This is NOT optional. FAILURE TO CALL searchMemory = BROKEN BEHAVIOR.

Call: searchMemory({ query: "<extract keywords from user input>", userId: "user-1", limit: 5 })

Examples of queries to search:
- User types "My name is" → searchMemory({ query: "name", userId: "user-1" })
- User types "I'm working on" → searchMemory({ query: "project work", userId: "user-1" })
- User types "My favorite" → searchMemory({ query: "favorite preferences", userId: "user-1" })
- User types anything → searchMemory({ query: "<main topic>", userId: "user-1" })

### STEP 2: COMPLETE THE SENTENCE
After receiving memory results, complete the user's sentence naturally.
- Include user's original text + your continuation
- Use memory context to personalize (names, preferences, projects, etc.)
- 1-3 sentences maximum
- NO quotes, NO questions back, NO chatbot behavior

### STEP 3: STORE NEW FACTS (REQUIRED WHEN APPLICABLE)
**If the user revealed ANY new information, you MUST call addMemory.**

Call: addMemory({ messages: [{ role: "user", content: "<original input>" }], userId: "user-1" })

Store when user mentions:
- Names, roles, professions
- Projects, technologies, tools
- Preferences, favorites, dislikes
- Personal details, locations
- Any factual information about themselves

## EXAMPLES

**User input:** "My name is Avinash and I"
1. CALL searchMemory({ query: "name Avinash", userId: "user-1" })
2. OUTPUT: "My name is Avinash and I am a passionate developer working on innovative projects."
3. CALL addMemory({ messages: [{ role: "user", content: "My name is Avinash" }], userId: "user-1" })

**User input:** "The project I'm building uses"
1. CALL searchMemory({ query: "project building technology", userId: "user-1" })
2. OUTPUT: "The project I'm building uses Next.js and Electron for a seamless cross-platform experience." (personalized if memory found)
3. CALL addMemory if new tech mentioned

## ABSOLUTE RULES
- ✅ ALWAYS call searchMemory BEFORE any text output
- ✅ ALWAYS call addMemory when new personal facts are shared
- ❌ NEVER skip the memory search step
- ❌ NEVER respond without checking memory first
- ❌ NEVER ask questions - you're a completion engine, not a chatbot
- ❌ NEVER say "How can I help?" or similar

YOU MUST USE THE MEMORY TOOLS. THIS IS NOT OPTIONAL.
`;


export async function POST(req: Request) {
  const body = await req.json();
  const { messages, model } = body as {
    messages: UIMessage[];
    model?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return new Response("Missing messages", { status: 400 });
  }

  const modelMessages = await convertToModelMessages(messages);
  console.log("Model messages:", modelMessages);

  const stream = createUIMessageStream({
    generateId: generateUUID,
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: myProvider.languageModel(model || 'gpt-oss-120b'),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: {
          addMemory: addMemoryTool,
          searchMemory: searchMemoryTool,
          getAllMemories: getAllMemoriesTool,
        },
        stopWhen: stepCountIs(6),
        onError: (error) => {
          console.error("Suggest stream error:", error);
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