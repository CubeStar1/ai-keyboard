import { readFileSync } from "node:fs"
import { useTerminalDimensions } from "@opentui/react"

function normalizeAsciiArt(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n")

  while (lines.length > 0 && lines[0].trim().length === 0) lines.shift()
  while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
    lines.pop()
  }

  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => (line.match(/^ */u)?.[0].length ?? 0))
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0

  return lines.map((line) => line.slice(minIndent).replace(/\s+$/u, ""))
}

const TABBY_ART = normalizeAsciiArt(
  readFileSync(new URL("../../assets/tabby.txt", import.meta.url), "utf8")
)
const ART_WIDTH = Math.max(0, ...TABBY_ART.map((line) => line.length))

export function GingerCat() {
  const { width } = useTerminalDimensions()

  const renderLine = (line: string) => {
    if (width <= 0) return ""
    if (width <= ART_WIDTH) return line.slice(0, width)
    const leftPad = Math.floor((width - ART_WIDTH) / 2)
    return `${" ".repeat(leftPad)}${line}`
  }

  const catArt = TABBY_ART.map((line) => renderLine(line)).join("\n")

  return (
    <box width="100%" flexGrow={1} flexDirection="column" justifyContent="center">
      <text fg="#FF8C42">{catArt}</text>
    </box>
  )
}
