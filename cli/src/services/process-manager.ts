import { Subprocess } from "bun"
import { BACKEND_DIR, NEXTJS_BACKEND_DIR } from "../utils/paths"

export type ServiceName = "python" | "nextjs"
export type LogCallback = (service: ServiceName, line: string) => void

interface ManagedProcess {
  proc: Subprocess
  service: ServiceName
  startedAt: number
}

const processes: Map<ServiceName, ManagedProcess> = new Map()

async function streamOutput(
  stream: ReadableStream<Uint8Array> | null,
  service: ServiceName,
  onLog: LogCallback
) {
  if (!stream) return
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""
      for (const line of lines) {
        if (line.trim()) {
          onLog(service, line)
        }
      }
    }
    // Flush remaining
    if (buffer.trim()) {
      onLog(service, buffer)
    }
  } catch {
    // Stream closed
  }
}

export function startPythonBackend(onLog: LogCallback): boolean {
  if (processes.has("python")) {
    onLog("python", "Already running")
    return false
  }

  try {
    const proc = Bun.spawn(
      ["uv", "run", "uvicorn", "main:app", "--reload", "--port", "8000"],
      {
        cwd: BACKEND_DIR,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env },
      }
    )

    processes.set("python", {
      proc,
      service: "python",
      startedAt: Date.now(),
    })

    onLog("python", "Starting Python backend on port 8000...")

    // Stream stdout and stderr
    streamOutput(proc.stdout as ReadableStream<Uint8Array>, "python", onLog)
    streamOutput(proc.stderr as ReadableStream<Uint8Array>, "python", onLog)

    // Monitor process exit
    proc.exited.then((code) => {
      processes.delete("python")
      onLog("python", `Process exited with code ${code}`)
    })

    return true
  } catch (err) {
    onLog("python", `Failed to start: ${err}`)
    return false
  }
}

export function startNextjsBackend(onLog: LogCallback): boolean {
  if (processes.has("nextjs")) {
    onLog("nextjs", "Already running")
    return false
  }

  try {
    const proc = Bun.spawn(["pnpm", "dev"], {
      cwd: NEXTJS_BACKEND_DIR,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    })

    processes.set("nextjs", {
      proc,
      service: "nextjs",
      startedAt: Date.now(),
    })

    onLog("nextjs", "Starting Next.js backend on port 3001...")

    streamOutput(proc.stdout as ReadableStream<Uint8Array>, "nextjs", onLog)
    streamOutput(proc.stderr as ReadableStream<Uint8Array>, "nextjs", onLog)

    proc.exited.then((code) => {
      processes.delete("nextjs")
      onLog("nextjs", `Process exited with code ${code}`)
    })

    return true
  } catch (err) {
    onLog("nextjs", `Failed to start: ${err}`)
    return false
  }
}

export function startAll(onLog: LogCallback): void {
  startPythonBackend(onLog)
  startNextjsBackend(onLog)
}

export async function stopProcess(service: ServiceName, onLog: LogCallback): Promise<void> {
  const managed = processes.get(service)
  if (!managed) {
    onLog(service, "Not running")
    return
  }

  onLog(service, "Stopping...")
  
  try {
    managed.proc.kill("SIGTERM")
    
    // Wait up to 5 seconds for graceful shutdown
    const timeout = setTimeout(() => {
      try {
        managed.proc.kill("SIGKILL")
        onLog(service, "Force killed (SIGKILL)")
      } catch {
        // Already dead
      }
    }, 5000)

    await managed.proc.exited
    clearTimeout(timeout)
    processes.delete(service)
    onLog(service, "Stopped")
  } catch {
    processes.delete(service)
    onLog(service, "Stopped (with errors)")
  }
}

export async function stopAll(onLog: LogCallback): Promise<void> {
  const promises: Promise<void>[] = []
  if (processes.has("python")) promises.push(stopProcess("python", onLog))
  if (processes.has("nextjs")) promises.push(stopProcess("nextjs", onLog))
  await Promise.all(promises)
}

export function isRunning(service: ServiceName): boolean {
  return processes.has(service)
}

export function getProcessInfo(service: ServiceName): {
  pid: number | null
  startedAt: number | null
  port: number
} {
  const managed = processes.get(service)
  return {
    pid: managed?.proc.pid ?? null,
    startedAt: managed?.startedAt ?? null,
    port: service === "python" ? 8000 : 3001,
  }
}

export async function healthCheck(
  service: ServiceName
): Promise<boolean> {
  const url =
    service === "python"
      ? "http://localhost:8000/docs"
      : "http://localhost:3001"

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return resp.ok
  } catch {
    return false
  }
}

export function getRunningServices(): ServiceName[] {
  return Array.from(processes.keys())
}
