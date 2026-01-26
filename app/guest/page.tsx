"use client"

import React from "react"
import { AnimatePresence } from "framer-motion"
import { MobileFrame } from "@/components/mobile-frame"
import { GuestShell } from "@/components/guest/guest-shell"

export default function GuestPage() {
  return (
    <MobileFrame>
      <main className="absolute inset-0 w-full h-full overflow-hidden rounded-[3rem]">
        <AnimatePresence mode="wait">
          <GuestShell />
        </AnimatePresence>
      </main>
    </MobileFrame>
  )
}

