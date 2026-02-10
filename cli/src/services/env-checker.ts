import { resolve } from "path"
import { BACKEND_DIR, NEXTJS_BACKEND_DIR } from "../utils/paths"

interface EnvVarStatus {
  service: string
  variable: string
  status: "set" | "missing"
}

const PYTHON_REQUIRED_VARS = [
  "OPENAI_API_KEY",
  "SUPABASE_CONNECTION_STRING",
]

const PYTHON_OPTIONAL_VARS = [
  "NEO4J_URL",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
]

const NEXTJS_REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ADMIN",
  "OPENAI_API_KEY",
  "MEMORY_API_URL",
]

const NEXTJS_OPTIONAL_VARS = [
  "RESEND_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GROQ_API_KEY",
  "TAVILY_API_KEY",
]

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "")
    if (key && value) env[key] = value
  }
  return env
}

export async function checkEnvVars(): Promise<EnvVarStatus[]> {
  const results: EnvVarStatus[] = []

  // Check Python backend .env
  let pythonEnv: Record<string, string> = {}
  try {
    const file = Bun.file(resolve(BACKEND_DIR, ".env"))
    const content = await file.text()
    pythonEnv = parseEnvFile(content)
  } catch {
    // .env doesn't exist
  }

  for (const v of PYTHON_REQUIRED_VARS) {
    results.push({
      service: "python",
      variable: v,
      status: pythonEnv[v] ? "set" : "missing",
    })
  }
  for (const v of PYTHON_OPTIONAL_VARS) {
    results.push({
      service: "python",
      variable: `${v} (optional)`,
      status: pythonEnv[v] ? "set" : "missing",
    })
  }

  // Check Next.js backend .env
  let nextjsEnv: Record<string, string> = {}
  try {
    const file = Bun.file(resolve(NEXTJS_BACKEND_DIR, ".env"))
    const content = await file.text()
    nextjsEnv = parseEnvFile(content)
  } catch {
    // .env doesn't exist
  }

  for (const v of NEXTJS_REQUIRED_VARS) {
    results.push({
      service: "nextjs",
      variable: v,
      status: nextjsEnv[v] ? "set" : "missing",
    })
  }
  for (const v of NEXTJS_OPTIONAL_VARS) {
    results.push({
      service: "nextjs",
      variable: `${v} (optional)`,
      status: nextjsEnv[v] ? "set" : "missing",
    })
  }

  return results
}
