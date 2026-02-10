import { useState, useEffect } from "react"
import { useTerminalDimensions } from "@opentui/react"

// ─── Proper cat ASCII art ────────────────────────────────────────────────────
// 3 animation frames: walking with different leg positions + tail wag

const CAT_1 = [
  "       |\\      _,,,---,,_       ",
  " ZZZzz /,`.-'`'    -.  ;-;;,_  ",
  "      |,4-  ) )-,_. ,\\ (  `'-' ",
  "     '---''(_/--'  `-'\\_)      ",
]

const CAT_WALK_1 = [
  "    /\\_____/\\         ",
  "   /  o   o  \\        ",
  "  ( ==  ^  == )       ",
  "   )         (        ",
  "  (           )       ",
  "  ( (  )   (  ) )     ",
  " (__(__)___(__)__)    ",
]

const CAT_WALK_2 = [
  "    /\\_____/\\         ",
  "   /  o   o  \\        ",
  "  ( ==  ^  == )       ",
  "   )         (        ",
  "  (           )       ",
  "  ( (  ) (  )  )      ",
  " (__(__) (__) __)     ",
]

const CAT_WALK_3 = [
  "    /\\_____/\\         ",
  "   /  -   -  \\        ",
  "  ( ==  ^  == )       ",
  "   )         (        ",
  "  (           )       ",
  "  ((  )   (  ))       ",
  " (_(__)___(__)_)      ",
]

// Bigger, better cat - unmistakably a cat

const BIG_1 = [
  "    |\\__/|            ",
  "    /     \\           ",
  "   / . . . \\          ",
  "  (   >Y<   )         ",
  "   \\  `-'  /          ",
  "    |     |           ",
  "    /|   |\\           ",
  "   (_|   |_)   ~      ",
]

const BIG_2 = [
  "    |\\__/|            ",
  "    /     \\     ~     ",
  "   / . . . \\          ",
  "  (   >Y<   )         ",
  "   \\  `-'  /          ",
  "    |     |           ",
  "   /|     |\\          ",
  "  (_|     |_)         ",
]

const BIG_3 = [
  "    |\\__/|      ~    ",
  "    /     \\           ",
  "   / ^ . ^ \\          ",
  "  (   >Y<   )         ",
  "   \\  `-'  /          ",
  "    |     |           ",
  "    /|   |\\           ",
  "   (_|   |_)          ",
]

// Use a nice recognizable sitting/walking cat (larger)

const GINGER_1 = [
  "              /|  /|            ",
  "             / | / |            ",
  "            /  |/  |            ",
  "      _____|       |_____       ",
  "     /     |  O  O |     \\      ",
  "    |      |   __  |      |     ",
  "    |      |  /  \\ |      |     ",
  "    |       \\ \\__/ /       |    ",
  "     \\_____  \\____/  _____/     ",
  "           |  |  |  |           ",
  "           |  |  |  |           ",
  "           |__|  |__|           ",
  "           (__/  \\__)      ~    ",
]

const GINGER_2 = [
  "              /|  /|            ",
  "             / | / |            ",
  "            /  |/  |            ",
  "      _____|       |_____       ",
  "     /     |  -  O |     \\      ",
  "    |      |   __  |      |     ",
  "    |      |  /  \\ |      |     ",
  "    |       \\ \\__/ /       |    ",
  "     \\_____  \\____/  _____/     ",
  "           | |   | |            ",
  "           | |   | |            ",
  "           |_|   |_|            ",
  "          (__/   \\__)    ~      ",
]

const GINGER_3 = [
  "              /|  /|            ",
  "             / | / |            ",
  "            /  |/  |            ",
  "      _____|       |_____       ",
  "     /     |  O  O |     \\      ",
  "    |      |   __  |      |     ",
  "    |      |  \\__/ |      |     ",
  "    |       \\      /       |    ",
  "     \\_____  \\____/  _____/     ",
  "          |  |   |  |           ",
  "          |  |   |  |           ",
  "          |__|   |__|           ",
  "          (__/   \\__)       ~   ",
]

const GINGER_4 = [
  "              /|  /|            ",
  "             / | / |            ",
  "            /  |/  |            ",
  "      _____|       |_____       ",
  "     /     |  O  - |     \\      ",
  "    |      |   __  |      |     ",
  "    |      |  /  \\ |      |     ",
  "    |       \\ \\__/ /       |    ",
  "     \\_____  \\____/  _____/     ",
  "           |  | |  |            ",
  "           |  | |  |            ",
  "           |__| |__|            ",
  "           (__/ \\__)     ~      ",
]

const CAT_FRAMES = [GINGER_1, GINGER_2, GINGER_3, GINGER_4]
const CAT_WIDTH = 32

export function GingerCat() {
  const { width } = useTerminalDimensions()
  const [xOffset, setXOffset] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)

  // Frame animation - cycle walk frames
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((f) => (f + 1) % CAT_FRAMES.length)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  // Position animation - cat walks left to right, wraps around
  useEffect(() => {
    const totalTravel = width + CAT_WIDTH
    let pos = 0
    const interval = setInterval(() => {
      pos = (pos + 1) % totalTravel
      setXOffset(pos - CAT_WIDTH)
    }, 120)
    return () => clearInterval(interval)
  }, [width])

  const currentFrame = CAT_FRAMES[frameIndex]

  // Pad each line to position the cat horizontally
  const padAmount = Math.max(0, xOffset)
  const pad = " ".repeat(padAmount)
  const catArt = currentFrame.map((line) => pad + line).join("\n")

  return (
    <box width="100%" flexGrow={1} flexDirection="column" justifyContent="center">
      <text fg="#FF8C42">{catArt}</text>
    </box>
  )
}
