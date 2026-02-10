import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react"
import type { ServiceName, LogCallback } from "../services/process-manager"

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppStatus = "idle" | "starting" | "running" | "stopping"

export interface LogEntry {
  service: ServiceName | "system"
  message: string
  timestamp: number
}

export interface ServiceInfo {
  status: "stopped" | "starting" | "running"
  pid: number | null
  port: number
  startedAt: number | null
}

export interface AppState {
  status: AppStatus
  logs: LogEntry[]
  python: ServiceInfo
  nextjs: ServiceInfo
  showHelp: boolean
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_STATUS"; status: AppStatus }
  | { type: "ADD_LOG"; service: ServiceName | "system"; message: string }
  | { type: "CLEAR_LOGS" }
  | { type: "SET_SERVICE_STATUS"; service: ServiceName; status: ServiceInfo["status"] }
  | { type: "SET_SERVICE_PID"; service: ServiceName; pid: number | null }
  | { type: "SET_SERVICE_STARTED"; service: ServiceName; startedAt: number }
  | { type: "TOGGLE_HELP" }
  | { type: "HIDE_HELP" }

// ─── Initial state ──────────────────────────────────────────────────────────

const initialState: AppState = {
  status: "idle",
  logs: [],
  python: { status: "stopped", pid: null, port: 8000, startedAt: null },
  nextjs: { status: "stopped", pid: null, port: 3001, startedAt: null },
  showHelp: false,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

const MAX_LOGS = 500

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status }

    case "ADD_LOG": {
      const entry: LogEntry = {
        service: action.service,
        message: action.message,
        timestamp: Date.now(),
      }
      const logs = [...state.logs, entry]
      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS)
      return { ...state, logs }
    }

    case "CLEAR_LOGS":
      return { ...state, logs: [] }

    case "SET_SERVICE_STATUS":
      return {
        ...state,
        [action.service]: { ...state[action.service], status: action.status },
      }

    case "SET_SERVICE_PID":
      return {
        ...state,
        [action.service]: { ...state[action.service], pid: action.pid },
      }

    case "SET_SERVICE_STARTED":
      return {
        ...state,
        [action.service]: {
          ...state[action.service],
          startedAt: action.startedAt,
          status: "starting",
        },
      }

    case "TOGGLE_HELP":
      return { ...state, showHelp: !state.showHelp }

    case "HIDE_HELP":
      return { ...state, showHelp: false }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  addLog: LogCallback
  addSystemLog: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addLog: LogCallback = useCallback(
    (service, message) => {
      dispatch({ type: "ADD_LOG", service, message })
    },
    [dispatch]
  )

  const addSystemLog = useCallback(
    (message: string) => {
      dispatch({ type: "ADD_LOG", service: "system", message })
    },
    [dispatch]
  )

  return (
    <AppContext.Provider value={{ state, dispatch, addLog, addSystemLog }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
