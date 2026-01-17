import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { context } = await req.json();
    
    if (!context || context.length < 5) {
      return NextResponse.json({ suggestion: '' });
    }

    // Use fast model for inline suggestions - speed is critical
    const result = await generateText({
      model: myProvider.languageModel('gpt-4o-mini'),
      prompt: `Complete this text naturally with 5-15 words. Return ONLY the completion, no quotes, no explanations:

"${context.slice(-200)}"`,
      maxOutputTokens: 40,
    });

    // Clean up the suggestion
    let suggestion = result.text.trim();
    
    // Remove any leading quotes or punctuation that might be duplicated
    if (suggestion.startsWith('"') || suggestion.startsWith("'")) {
      suggestion = suggestion.substring(1);
    }
    if (suggestion.endsWith('"') || suggestion.endsWith("'")) {
      suggestion = suggestion.slice(0, -1);
    }

    console.log('[suggest-inline] Context:', context.slice(-50), '→', suggestion.slice(0, 50));

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('[suggest-inline] Error:', error);
    return NextResponse.json({ suggestion: '' });
  }
}
