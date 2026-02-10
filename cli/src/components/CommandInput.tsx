import { useState, useCallback } from "react"
import { useKeyboard } from "@opentui/react"
import { useApp } from "../context/AppContext"
import {
  startAll,
  stopAll,
  isRunning,
  getProcessInfo,
  healthCheck,
} from "../services/process-manager"
import { checkEnvVars } from "../services/env-checker"

export function CommandInput() {
  const [value, setValue] = useState("")
  const { state, dispatch, addLog, addSystemLog } = useApp()

  const handleCommand = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase()
      dispatch({ type: "HIDE_HELP" })

      switch (trimmed) {
        case "/start": {
          if (state.status === "running" || state.status === "starting") {
            addSystemLog("Services are already running. Use /stop first.")
            return
          }
          dispatch({ type: "SET_STATUS", status: "starting" })
          dispatch({ type: "SET_SERVICE_STATUS", service: "python", status: "starting" })
          dispatch({ type: "SET_SERVICE_STATUS", service: "nextjs", status: "starting" })
          addSystemLog("Starting all services...")

          startAll((service, message) => {
            addLog(service, message)
          })

          // Set PIDs after a short delay
          setTimeout(() => {
            const pyInfo = getProcessInfo("python")
            const njInfo = getProcessInfo("nextjs")
            if (pyInfo.pid) {
              dispatch({ type: "SET_SERVICE_PID", service: "python", pid: pyInfo.pid })
              dispatch({ type: "SET_SERVICE_STARTED", service: "python", startedAt: Date.now() })
            }
            if (njInfo.pid) {
              dispatch({ type: "SET_SERVICE_PID", service: "nextjs", pid: njInfo.pid })
              dispatch({ type: "SET_SERVICE_STARTED", service: "nextjs", startedAt: Date.now() })
            }
            dispatch({ type: "SET_STATUS", status: "running" })
          }, 1500)

          // Health check loop
          const checkHealth = async () => {
            let attempts = 0
            const maxAttempts = 30
            const interval = setInterval(async () => {
              attempts++
              if (attempts > maxAttempts) {
                clearInterval(interval)
                return
              }
              const pyHealthy = await healthCheck("python")
              const njHealthy = await healthCheck("nextjs")
              if (pyHealthy) {
                dispatch({ type: "SET_SERVICE_STATUS", service: "python", status: "running" })
              }
              if (njHealthy) {
                dispatch({ type: "SET_SERVICE_STATUS", service: "nextjs", status: "running" })
              }
              if (pyHealthy && njHealthy) {
                dispatch({ type: "SET_STATUS", status: "running" })
                addSystemLog("All services are healthy!")
                clearInterval(interval)
              }
            }, 2000)
          }
          checkHealth()
          break
        }

        case "/stop": {
          if (state.status === "idle") {
            addSystemLog("No services are running.")
            return
          }
          dispatch({ type: "SET_STATUS", status: "stopping" })
          addSystemLog("Stopping all services...")

          await stopAll((service, message) => {
            addLog(service, message)
          })

          dispatch({ type: "SET_SERVICE_STATUS", service: "python", status: "stopped" })
          dispatch({ type: "SET_SERVICE_STATUS", service: "nextjs", status: "stopped" })
          dispatch({ type: "SET_SERVICE_PID", service: "python", pid: null })
          dispatch({ type: "SET_SERVICE_PID", service: "nextjs", pid: null })
          dispatch({ type: "SET_STATUS", status: "idle" })
          addSystemLog("All services stopped.")
          break
        }

        case "/status": {
          const pyInfo = getProcessInfo("python")
          const njInfo = getProcessInfo("nextjs")
          const pyRunning = isRunning("python")
          const njRunning = isRunning("nextjs")

          addSystemLog("─── Service Status ───")
          addSystemLog(
            `Python:  ${pyRunning ? "RUNNING" : "STOPPED"}  port:${pyInfo.port}  pid:${pyInfo.pid ?? "—"}`
          )
          addSystemLog(
            `Next.js: ${njRunning ? "RUNNING" : "STOPPED"}  port:${njInfo.port}  pid:${njInfo.pid ?? "—"}`
          )
          addSystemLog("─────────────────────")
          break
        }

        case "/env": {
          addSystemLog("Checking environment variables...")
          const results = await checkEnvVars()

          addSystemLog("─── Environment Variables ───")
          let currentService = ""
          for (const r of results) {
            if (r.service !== currentService) {
              currentService = r.service
              addSystemLog(`  [${r.service}]`)
            }
            const icon = r.status === "set" ? "✓" : "✗"
            addSystemLog(`    ${icon} ${r.variable}: ${r.status.toUpperCase()}`)
          }
          addSystemLog("────────────────────────────")
          break
        }

        case "/help": {
          dispatch({ type: "TOGGLE_HELP" })
          break
        }

        case "/clear": {
          dispatch({ type: "CLEAR_LOGS" })
          addSystemLog("Logs cleared.")
          break
        }

        default: {
          if (trimmed.startsWith("/")) {
            addSystemLog(`Unknown command: ${trimmed}. Type /help for available commands.`)
          } else if (trimmed) {
            addSystemLog(`Commands start with /. Type /help for available commands.`)
          }
        }
      }
    },
    [state.status, dispatch, addLog, addSystemLog]
  )

  // Handle keyboard input for the text field
  useKeyboard((key) => {
    if (key.name === "return" || key.name === "enter") {
      if (value.trim()) {
        handleCommand(value)
        setValue("")
      }
    }
  })

  return (
    <box
      width="100%"
      border
      borderStyle="rounded"
      borderColor="#FF8C42"
      flexDirection="row"
      alignItems="center"
    >
      <text>
        <span fg="#FF8C42">
          <strong> tabby &gt; </strong>
        </span>
      </text>
      <input
        value={value}
        onChange={(newValue: string) => setValue(newValue)}
        focused
        backgroundColor="#1a1a1a"
        textColor="#FFFFFF"
        cursorColor="#FF8C42"
        focusedBackgroundColor="#0D0D0D"
        flexGrow={1}
      />
    </box>
  )
}
