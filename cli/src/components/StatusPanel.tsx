import { useState, useEffect } from "react"
import { useApp, type ServiceInfo } from "../context/AppContext"
import type { ServiceName } from "../services/process-manager"

// ─── Spinner ─────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

function Spinner({ active }: { active: boolean }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length)
    }, 80)
    return () => clearInterval(interval)
  }, [active])

  if (!active) return null
  return <text fg="#FFD700">{SPINNER_FRAMES[frame]} </text>
}

// ─── Uptime ──────────────────────────────────────────────────────────────────

function Uptime({ startedAt }: { startedAt: number | null }) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    if (!startedAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - startedAt) / 1000)
      const mins = Math.floor(diff / 60)
      const secs = diff % 60
      setElapsed(`${mins}m ${secs}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  if (!startedAt) return <text fg="#555555">—</text>
  return <text fg="#888888">{elapsed}</text>
}

// ─── Service Row ─────────────────────────────────────────────────────────────

function ServiceRow({
  name,
  label,
  info,
}: {
  name: ServiceName
  label: string
  info: ServiceInfo
}) {
  const statusColor =
    info.status === "running"
      ? "#50FA7B"
      : info.status === "starting"
        ? "#FFD700"
        : "#FF5555"

  const statusIcon =
    info.status === "running"
      ? "●"
      : info.status === "stopped"
        ? "○"
        : ""

  const serviceColor = name === "python" ? "#50FA7B" : "#8BE9FD"

  return (
    <box flexDirection="row" gap={1} paddingLeft={1}>
      {info.status === "starting" ? (
        <Spinner active />
      ) : (
        <text fg={statusColor}>{statusIcon} </text>
      )}
      <text>
        <span fg={serviceColor}>
          <strong>{label}</strong>
        </span>
      </text>
      <text fg={statusColor}>{info.status.toUpperCase()}</text>
      <text fg="#555555">│</text>
      <text fg="#888888">:{info.port}</text>
      {info.pid && (
        <>
          <text fg="#555555">│</text>
          <text fg="#888888">PID {info.pid}</text>
        </>
      )}
      <text fg="#555555">│</text>
      <Uptime startedAt={info.startedAt} />
    </box>
  )
}

// ─── StatusPanel ─────────────────────────────────────────────────────────────

export function StatusPanel() {
  const { state } = useApp()

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor="#444444"
      padding={1}
      width="100%"
    >
      <box marginBottom={1}>
        <text>
          <span fg="#FF8C42">
            <strong>  Services</strong>
          </span>
        </text>
      </box>
      <ServiceRow name="python" label="Python Memory API " info={state.python} />
      <ServiceRow name="nextjs" label="Next.js Backend   " info={state.nextjs} />
    </box>
  )
}
