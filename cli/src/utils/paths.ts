import { resolve, dirname } from "path"

const CLI_DIR = dirname(new URL(import.meta.url).pathname)

// On Windows, remove leading slash from /C:/... paths
function normalizePath(p: string): string {
  if (process.platform === "win32" && p.startsWith("/") && p[2] === ":") {
    return p.slice(1)
  }
  return p
}

export const WORKSPACE_ROOT = normalizePath(resolve(CLI_DIR, "..", ".."))
export const BACKEND_DIR = resolve(WORKSPACE_ROOT, "backend")
export const NEXTJS_BACKEND_DIR = resolve(WORKSPACE_ROOT, "nextjs-backend")
export const FRONTEND_DIR = resolve(WORKSPACE_ROOT, "frontend")
