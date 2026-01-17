import { NextResponse } from 'next/server';
import { generateText, stepCountIs } from 'ai';
import { myProvider } from '@/lib/ai';
import { defaultFastModel } from '@/lib/ai/models';
import { tavilySearchTool } from '@/lib/ai/tools/tavily-search';
import {
  addMemoryTool,
  searchMemoryTool,
  getAllMemoriesTool,
} from '@/lib/ai/tools/memory';

const SYSTEM_PROMPT = `You are a seamless inline text completion assistant integrated into an intelligent keyboard. Your job is to predict and complete text naturally, as if you are the user's own thoughts.

## CORE BEHAVIOR
- Complete text with 5-15 words maximum
- Sound natural and contextually appropriate  
- Match the user's tone, style, and vocabulary
- Never add explanations, quotes, or metadata
- Continue exactly from where the user left off

## STYLE MATCHING
- If formal → maintain formal language
- If casual → keep it conversational
- If technical → use appropriate terminology
- If creative → match the creative voice

## MEMORY SYSTEM - USE PROACTIVELY
User ID: "user-1" (always use this)

### BEFORE COMPLETING TEXT:
**Call searchMemory first** to personalize your completion.
Search for: user's writing style, preferences, tech stack, projects, and context.
Call: searchMemory({ query: "<keywords from context>", userId: "user-1", limit: 3 })

### STORE NEW INSIGHTS:
If the text reveals new facts about the user, store them:
Call: addMemory({ messages: [{ role: "user", content: "<fact>" }], userId: "user-1" })

## WEB SEARCH
Use tavilySearchTool when completing text that references:
- Current events or recent information
- Technical facts that need verification
- Specific data points or statistics

## OUTPUT RULES
- Return ONLY the completion text
- No quotation marks
- No explanations or preambles
- No "Here's the completion:" type prefixes
- Just the natural continuation of their text

IMPORTANT: Search memory before completing. This is NOT optional.`;

export async function POST(req: Request) {
  try {
    const { context } = await req.json();
    
    if (!context || context.length < 5) {
      return NextResponse.json({ suggestion: '' });
    }

    const result = await generateText({
      model: myProvider.languageModel(defaultFastModel),
      system: SYSTEM_PROMPT,
      prompt: `Complete this text naturally with 5-15 words. Return ONLY the completion, no quotes, no explanations:

"${context.slice(-200)}"`,
      tools: {
        tavilySearchTool,
        addMemory: addMemoryTool,
        searchMemory: searchMemoryTool,
        getAllMemories: getAllMemoriesTool,
      },
      stopWhen: stepCountIs(5),
    });

    // Clean up the suggestion
    let suggestion = result.text.trim();

    console.log('[suggest-inline] Context:', context.slice(-50), '→', suggestion.slice(0, 50));

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('[suggest-inline] Error:', error);
    return NextResponse.json({ suggestion: '' });
  }
}
