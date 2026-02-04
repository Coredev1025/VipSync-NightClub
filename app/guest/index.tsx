import { MotiView } from "moti"
import * as React from "react"

import { GuestShell } from "@/components/guest/guest-shell"
import { MobileFrame } from "@/components/mobile-frame"

export default function GuestScreen() {
  return (
    <MobileFrame>
      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
        <GuestShell />
      </MotiView>
    </MobileFrame>
  )
}

