import { useApp } from "../context/AppContext"

function formatTime(ts: number): string {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  const s = d.getSeconds().toString().padStart(2, "0")
  return `${h}:${m}:${s}`
}

export function LogPanel() {
  const { state } = useApp()

  if (state.logs.length === 0) {
    return (
      <box
        flexGrow={1}
        border
        borderStyle="rounded"
        borderColor="#333333"
        padding={1}
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        <text fg="#555555">
          <em>No logs yet. Services will output here when running.</em>
        </text>
      </box>
    )
  }

  // Show last N logs that fit
  const recentLogs = state.logs.slice(-100)

  return (
    <box
      flexGrow={1}
      border
      borderStyle="rounded"
      borderColor="#333333"
      padding={1}
      width="100%"
      flexDirection="column"
    >
      <box marginBottom={1}>
        <text>
          <span fg="#FF8C42">
            <strong>  Logs</strong>
          </span>
        </text>
      </box>
      <scrollbox focused={false}>
        {recentLogs.map((entry, i) => {
          const tagColor =
            entry.service === "python"
              ? "#50FA7B"
              : entry.service === "nextjs"
                ? "#8BE9FD"
                : "#FFD700"
          const tag =
            entry.service === "python"
              ? "[python]"
              : entry.service === "nextjs"
                ? "[nextjs]"
                : "[system]"

          return (
            <box key={i} flexDirection="row" gap={1}>
              <text fg="#444444">{formatTime(entry.timestamp)}</text>
              <text fg={tagColor}>
                <strong>{tag}</strong>
              </text>
              <text fg="#CCCCCC">{entry.message}</text>
            </box>
          )
        })}
      </scrollbox>
    </box>
  )
}
