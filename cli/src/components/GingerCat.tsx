import { useState, useEffect } from "react"
import { useTerminalDimensions } from "@opentui/react"

// Cat butler with tuxedo - walking frames
const BUTLER_WALK_1 = [
  "  /\\_/\\",
  " ( o.o )",
  "  > ⋈ <  ",
  " /| ▓ |\\ ",
  "( | ▓ | )",
  " /  ▓  \\",
  "(__|▓|__)",
]

const BUTLER_WALK_2 = [
  "  /\\_/\\",
  " ( o.o )",
  "  > ⋈ <",
  "  | ▓ |\\",
  " (| ▓ | )",
  "  / ▓  \\",
  " (__|▓|__)",
]

const BUTLER_WALK_3 = [
  "  /\\_/\\",
  " ( -.- )",
  "  > ⋈ <",
  " /| ▓ |\\",
  "( | ▓ | )",
  " /  ▓  \\",
  "(__|▓|__)",
]

const BUTLER_WALK_4 = [
  "  /\\_/\\",
  " ( o.o )",
  "  > ⋈ <",
  " /| ▓ |",
  "( | ▓ |)",
  "  \\ ▓  \\",
  "  (__|▓|__)",
]

const CAT_FRAMES = [BUTLER_WALK_1, BUTLER_WALK_2, BUTLER_WALK_3, BUTLER_WALK_4]

function trimmedWidth(line: string): number {
  return line.replace(/\s+$/u, "").length
}

const CAT_WIDTH = Math.max(
  ...CAT_FRAMES.flatMap((frame) => frame.map((line) => trimmedWidth(line)))
)

export function GingerCat() {
  const { width } = useTerminalDimensions()
  const [xOffset, setXOffset] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  // Frame animation - cycle walk frames
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((f) => (f + 1) % CAT_FRAMES.length)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  // Position animation - cat loops from left to right
  useEffect(() => {
    const leftEdge = -CAT_WIDTH
    let pos = leftEdge

    const interval = setInterval(() => {
      pos += 1
      if (pos > width) {
        pos = leftEdge
      }
      setXOffset(pos)
    }, 90)
    return () => clearInterval(interval)
  }, [width])

  const currentFrame = CAT_FRAMES[frameIndex]

  const mirrorLine = (line: string) => {
    const swaps: Record<string, string> = {
      "/": "\\",
      "\\": "/",
      "(": ")",
      ")": "(",
      "<": ">",
      ">": "<",
      "|": "|",
      "▓": "▓",
      "⋈": "⋈",
      "_": "_",
    }
    return line
      .split("")
      .reverse()
      .map((ch) => swaps[ch] ?? ch)
      .join("")
  }

  const displayFrame =
    direction === 1 ? currentFrame : currentFrame.map((line) => mirrorLine(line))

  const renderLine = (line: string) => {
    if (width <= 0) return ""
    const trimmed = line.replace(/\s+$/u, "")
    if (xOffset >= width) return ""

    if (xOffset < 0) {
      const visible = trimmed.slice(-xOffset)
      return visible.slice(0, width)
    }

    const pad = " ".repeat(xOffset)
    const full = pad + trimmed
    return full.length > width ? full.slice(0, width) : full
  }

  const catArt = displayFrame.map((line) => renderLine(line)).join("\n")

  return (
    <box width="100%" flexGrow={1} flexDirection="column" justifyContent="center">
      <text fg="#FF8C42">{catArt}</text>
    </box>
  )
}
