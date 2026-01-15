
import {
  streamText,
  Output,
  stepCountIs,
} from "ai";
import { myProvider } from "@/lib/ai";
import { defaultModel } from "@/lib/ai/models";
import { z } from "zod";
import { addMemoryTool, searchMemoryTool, getAllMemoriesTool } from "@/lib/ai/tools/memory";
import {
  saveInterviewSession,
  saveInterviewMessage,
  getInterviewSessionById,
  generateInterviewSessionTitle,
} from "@/actions/interview-copilot";

const analysisSchema = z.object({
  idea: z.string().describe("Problem understanding, key observations, approaches"),
  code: z.string().describe("Clean, well-commented implementation code"),
  walkthrough: z.string().describe("Step-by-step explanation of the solution"),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
    reason: z.string()
  })).describe("Edge cases and test inputs"),
  memories: z.array(z.object({
    memory: z.string().describe("The memory content - a fact or preference about the user"),
    createdAt: z.string().describe("ISO timestamp when this memory was retrieved/created")
  })).describe("Relevant memories retrieved about the user's preferences and context")
});


const SYSTEM_PROMPT = `You are an expert Interview Copilot for technical coding interviews.

## YOUR MISSION
Analyze the user's screen (showing a coding problem) and provide comprehensive assistance with perfectly structured, GitHub-flavored Markdown output.

## MEMORY SYSTEM - USE PROACTIVELY
User ID: "user-1" (always use this)

### ALWAYS SEARCH MEMORIES FIRST:
- Call \`searchMemory\` with queries like "coding style", "language preference", "interview prep"
- Check for preferred programming languages, coding conventions, past problem patterns
- Look for user's technical background and experience level

### STORE MEMORIES when you learn:
- User's preferred language (Python, Java, C++, etc.)
- Coding style preferences (variable naming, comments, etc.)
- Common mistakes the user makes
- Topics they struggle with or excel at
- Interview target companies or roles

## OUTPUT FORMATTING REQUIREMENTS
Format ALL content fields using **GitHub-Flavored Markdown**:

### For the \`idea\` field:
\`\`\`markdown
## 💡 Problem Analysis

### Key Observations
- Bullet point insights about the problem
- Pattern recognition (e.g., "This is a sliding window problem")

### Approach
1. Numbered step-by-step strategy
2. Time/Space complexity targets

### Edge Cases to Consider
- Empty input, single element, duplicates, etc.
\`\`\`

### For the \`code\` field:
- MUST be wrapped in triple backticks with language identifier
- Include clear comments explaining key logic
- Use proper indentation and clean formatting
\`\`\`markdown
\`\`\`python
def solution(nums: List[int]) -> int:
    # Initialize variables
    result = 0
    
    # Main algorithm logic
    for num in nums:
        result += num
    
    return result
\`\`\`
\`\`\`

### For the \`walkthrough\` field:
\`\`\`markdown
## 🚶 Step-by-Step Walkthrough

### Step 1: Initialization
Explain what we set up and why...

### Step 2: Main Loop
Walk through the core algorithm...

### Step 3: Return Result
Explain the final computation...

### Complexity Analysis
| Metric | Value | Explanation |
|--------|-------|-------------|
| Time   | O(n)  | Single pass through array |
| Space  | O(1)  | Only using constant extra space |
\`\`\`

### For the \`testCases\` array:
Each test case should have clear input, output, and reason fields.

### For the \`memories\` array:
Include ALL relevant memories you retrieved from the memory search. Each memory object should have:
- \`memory\`: The actual memory content (e.g., "User prefers Python for interviews")
- \`createdAt\`: ISO timestamp of when the memory was created/retrieved (use current time if creating new)

## WORKFLOW
1. **Search memories** using \`searchMemory\` for user preferences (language, style, level)
2. **Analyze the problem** from the screenshot/context
3. **Generate structured output** with beautiful markdown formatting
4. **Include retrieved memories** in the \`memories\` field of your response
5. **Store any new insights** about the user using \`addMemory\`

Be concise but thorough. Use the user's preferred language if found in memory.`

export async function POST(req: Request) {
  const { context, screenshot, sessionId, messageId, assistantMessageId, history } = await req.json();

  console.log("history", history);

  if (sessionId && messageId) {
    const existingSession = await getInterviewSessionById(sessionId);
    if (!existingSession) {
      const title = await generateInterviewSessionTitle(context || "Coding problem analysis");
      await saveInterviewSession({ id: sessionId, title });
    }
    await saveInterviewMessage({
      id: messageId,
      sessionId,
      role: "user",
      content: context || "Analyze this coding problem.",
    });
  }

  const historyMessages = (history || []).map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const currentMessage = {
    role: "user" as const,
    content: [
      { type: "text" as const, text: context || "Analyze this coding problem." },
      ...(screenshot ? [{ type: "image" as const, image: screenshot }] : []),
    ],
  };

  const result = streamText({
    model: myProvider.languageModel(defaultModel),
    system: SYSTEM_PROMPT,
    messages: [...historyMessages, currentMessage],
    tools: {
      searchMemory: searchMemoryTool,
      getAllMemories: getAllMemoriesTool,
      addMemory: addMemoryTool,
    },
    output: Output.object({
      schema: analysisSchema,
    }),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      if (sessionId && assistantMessageId && text) {
        try {
          const output = JSON.parse(text) as z.infer<typeof analysisSchema>;
          await saveInterviewMessage({
            id: assistantMessageId,
            sessionId,
            role: "assistant",
            content: "Analysis complete",
            analysis: output,
          });
        } catch (error) {
          console.error("Error parsing/saving assistant message:", error);
        }
      }
    },
  });

  return result.toTextStreamResponse();
}


