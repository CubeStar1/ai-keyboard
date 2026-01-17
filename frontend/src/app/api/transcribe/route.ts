import { experimental_transcribe as transcribe } from "ai";
import { createGroq } from "@ai-sdk/groq";

export async function POST(req: Request) {
  try {
    const { audio } = await req.json();

    if (!audio) {
      return Response.json({ error: "No audio data provided" }, { status: 400 });
    }

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const result = await transcribe({
      model: groq.transcription("whisper-large-v3"),
      audio,
    });

    return Response.json({
      text: result.text,
      language: result.language,
      duration: result.durationInSeconds,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
