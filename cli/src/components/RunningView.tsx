import { StatusPanel } from "./StatusPanel"
import { LogPanel } from "./LogPanel"

export function RunningView() {
  return (
    <box
      width="100%"
      flexGrow={1}
      flexDirection="column"
      gap={1}
    >
      <StatusPanel />
      <LogPanel />
    </box>
  )
}
