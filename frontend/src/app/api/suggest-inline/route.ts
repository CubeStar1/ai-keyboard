import { NextResponse } from 'next/server';
import { generateText, stepCountIs } from 'ai';
import { myProvider } from '@/lib/ai';
import { defaultFastModel } from '@/lib/ai/models';
import { tavilySearchTool } from '@/lib/ai/tools/tavily-search';
import {
  addMemoryTool,
  searchMemoryTool,
} from '@/lib/ai/tools/memory';
import { searchMemory } from '@/lib/ai/tools/memory/client';

const getSystemPrompt = (userId: string, relevantMemories: string[]) => `You are a seamless inline text and code completion assistant. Your job is to predict and complete what the user is typing naturally, whether it's prose, messages, or code.

## WHAT YOU DO
- Complete text naturally from where the user left off
- Complete code with proper syntax, function calls, and patterns
- Use stored memories to personalize completions when relevant
- Provide helpful, substantial completions (not too short!)

## COMPLETION LENGTH
- For prose/messages: 5-20 words is ideal
- For code: complete the logical unit (function call, statement, block)
- Don't be stingy - provide useful, complete suggestions

## USER CONTEXT (Long-term Memory)
${relevantMemories.length > 0 ? relevantMemories.map(m => `- ${m}`).join('\n') : 'No relevant memories found.'}

## TOOLS FOR MISSING CONTEXT  
Use \`searchMemory\` to find more context when needed.
**User ID:** "${userId}" (REQUIRED for tool calls)

Example: \`searchMemory({ query: "project details", userId: "${userId}" })\`

## CODE COMPLETION
When completing code:
- Match the language and coding style
- Complete function calls with likely parameters
- Suggest common patterns (error handling, async/await, etc.)
- Complete import statements, variable declarations, etc.

Examples:
- \`const user = await\` → \`prisma.user.findUnique({ where: { id: userId } })\`
- \`function handle\` → \`Submit(event: React.FormEvent) {\`
- \`import { useState\` → \`, useEffect } from 'react'\`

## TEXT COMPLETION  
When completing prose:
- Use memories for personal details (names, projects, preferences)
- Generic completions are fine when no memory applies
- Only avoid making up SPECIFIC facts not in memories (dates, names you don't know)

Examples:
- "I'll send you the" → "updated files by end of day"
- "The meeting with" + memory of "dev team standup" → "the dev team went well"

## OUTPUT
Return ONLY the completion text. No quotes, no explanations, no prefixes.`;


export async function POST(req: Request) {
  try {
    const { context, userId } = await req.json();
    console.log('[suggest-inline] Context:', context);
    
    if (!context || context.length < 5) {
      return NextResponse.json({ suggestion: '' });
    }

    if (!userId) {
      return new Response("Unauthorized: Missing User ID", { status: 401 });
    }

    const lastChunk = context.slice(-200);
    let relevantMemories: string[] = [];
    
    try {
      const memoryResult = await searchMemory(lastChunk, userId, 5);
      
      const memories = memoryResult?.results?.results || [];
      
      if (Array.isArray(memories)) {
        relevantMemories = memories.map((m: any) => m.memory);
      }
    } catch (err) {
      console.warn('[suggest-inline] Failed to fetch memories:', err);
    }
    console.log('[suggest-inline] Relevant memories:', relevantMemories);
    const result = await generateText({
      model: myProvider.languageModel(defaultFastModel),
      system: getSystemPrompt(userId, relevantMemories),
      prompt: `Complete this naturally. For prose: 5-20 words. For code: complete the statement/block. Use memories when relevant. Return ONLY the completion:

"${lastChunk}"`,
      temperature: 0.5,
      tools: {
        tavilySearchTool,
        addMemory: addMemoryTool,
        searchMemory: searchMemoryTool,
      },
      stopWhen: stepCountIs(5),
    });

    let suggestion = result.text.trim();

    console.log('[suggest-inline] Context:', context.slice(-50), '→', suggestion.slice(0, 50));

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('[suggest-inline] Error:', error);
    return NextResponse.json({ suggestion: '' });
  }
}
