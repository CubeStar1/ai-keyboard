import { GingerCat } from "./GingerCat"

export function IdleView() {
  return (
    <box
      width="100%"
      flexGrow={1}
      flexDirection="column"
    >
      <GingerCat />
      <box justifyContent="center" width="100%" paddingBottom={1}>
        <text>
          <span fg="#666666">Type </span>
          <span fg="#FF8C42">
            <strong>/help</strong>
          </span>
          <span fg="#666666"> for commands  |  </span>
          <span fg="#FF8C42">
            <strong>/start</strong>
          </span>
          <span fg="#666666"> to launch services</span>
        </text>
      </box>
    </box>
  )
}
