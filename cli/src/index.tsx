#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"

const renderer = await createCliRenderer({
  exitOnCtrlC: false, // We handle Ctrl+C ourselves for graceful shutdown
})

createRoot(renderer).render(<App />)
