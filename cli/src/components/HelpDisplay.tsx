export function HelpDisplay() {
  const commands = [
    { cmd: "/start", desc: "Start all backend services" },
    { cmd: "/stop", desc: "Stop all running services" },
    { cmd: "/status", desc: "Show service status details" },
    { cmd: "/env", desc: "Check environment variables" },
    { cmd: "/clear", desc: "Clear log output" },
    { cmd: "/help", desc: "Show this help message" },
    { cmd: "Ctrl+C", desc: "Quit (stops services first)" },
  ]

  return (
    <box
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor="#FF8C42"
      padding={1}
      width={50}
    >
      <box marginBottom={1} justifyContent="center">
        <text>
          <span fg="#FF8C42">
            <strong>  Available Commands</strong>
          </span>
        </text>
      </box>
      {commands.map(({ cmd, desc }, i) => (
        <box key={i} flexDirection="row" paddingLeft={1}>
          <box width={14}>
            <text>
              <span fg="#8BE9FD">
                <strong>{cmd}</strong>
              </span>
            </text>
          </box>
          <text fg="#BBBBBB">{desc}</text>
        </box>
      ))}
    </box>
  )
}
