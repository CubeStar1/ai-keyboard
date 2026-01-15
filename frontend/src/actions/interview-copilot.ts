"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { InterviewSession, InterviewMessage, InterviewAnalysis } from "@/lib/ai/types";
import { myProvider } from "@/lib/ai";
import { generateText } from "ai";
import { getTitleGenerationModel } from "@/lib/ai/provider";
import { defaultModel } from "@/lib/ai/models";

export async function getInterviewSessions(): Promise<InterviewSession[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching interview sessions:", error);
    return [];
  }
  return data as InterviewSession[];
}

export async function getInterviewSessionById(
  sessionId: string
): Promise<InterviewSession | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching interview session:", error);
    return null;
  }
  return data as InterviewSession;
}

export async function getInterviewSessionMessages(
  sessionId: string
): Promise<InterviewMessage[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching interview messages:", error);
    return [];
  }
  return data as InterviewMessage[];
}

export async function saveInterviewSession({
  id,
  title,
}: {
  id: string;
  title: string;
}): Promise<InterviewSession | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({ id, title })
    .select()
    .single();

  if (error) {
    console.error("Error creating interview session:", error);
    return null;
  }
  return data as InterviewSession;
}

export async function saveInterviewMessage({
  id,
  sessionId,
  role,
  content,
  analysis,
}: {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  analysis?: InterviewAnalysis;
}): Promise<InterviewMessage | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("interview_messages")
    .upsert(
      {
        id,
        session_id: sessionId,
        role,
        content,
        analysis: analysis || null,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving interview message:", error);
    return null;
  }

  await supabase
    .from("interview_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return data as InterviewMessage;
}

export async function deleteInterviewSession(sessionId: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("interview_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Error deleting interview session:", error);
    throw error;
  }
}

export async function generateInterviewSessionTitle(
  content: string,
  model?: string
): Promise<string> {
  try {
    if (!content) return "New Interview";

    const { text: title } = await generateText({
      model: myProvider.languageModel(getTitleGenerationModel(model || defaultModel)),
      system: `Generate a very short title (max 5 words) for this coding interview session based on the prompt. Return ONLY the title, no quotes or punctuation.`,
      prompt: content.slice(0, 500),
    });

    return title.trim() || "New Interview";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Interview";
  }
}
