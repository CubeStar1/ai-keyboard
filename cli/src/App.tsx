import { useKeyboard, useRenderer } from "@opentui/react"
import { AppProvider, useApp } from "./context/AppContext"
import { IdleView } from "./components/IdleView"
import { RunningView } from "./components/RunningView"
import { CommandInput } from "./components/CommandInput"
import { HelpDisplay } from "./components/HelpDisplay"
import { stopAll } from "./services/process-manager"

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  return (
    <box width="100%" justifyContent="center" paddingTop={3} paddingBottom={1}>
      <box flexDirection="column" alignItems="center">
        <ascii-font text="TABBY" font="block" color="#FF8C42" />
        <text>
          <span fg="#888888">
            <em>Local Stack Manager</em>
          </span>
          <span fg="#555555"> · </span>
          <span fg="#666666">v0.1.0</span>
        </text>
      </box>
    </box>
  )
}

// ─── Main Content ────────────────────────────────────────────────────────────

function MainContent() {
  const { state } = useApp()

  if (state.showHelp) {
    return (
      <box flexGrow={1} width="100%" justifyContent="center" alignItems="center">
        <HelpDisplay />
      </box>
    )
  }

  if (state.status === "idle") {
    return <IdleView />
  }

  return <RunningView />
}

// ─── App Inner (needs context) ───────────────────────────────────────────────

function AppInner() {
  const renderer = useRenderer()
  const { addLog, addSystemLog } = useApp()

  // Global keyboard shortcuts
  useKeyboard((key) => {
    if (key.ctrl && key.name === "c") {
      addSystemLog("Shutting down...")
      stopAll((service, message) => {
        addLog(service, message)
      }).then(() => {
        renderer.destroy()
      })
    }
  })

  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      backgroundColor="#0D0D0D"
    >
      <Header />
      <MainContent />
      <CommandInput />
    </box>
  )
}

// ─── App Root ────────────────────────────────────────────────────────────────

export function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
