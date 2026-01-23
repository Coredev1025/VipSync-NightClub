"use client"

import { ReactNode } from "react"

interface MobileFrameProps {
  children: ReactNode
}

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-4 md:p-8 overflow-auto">
      {/* Phone Frame Container - Increased size */}
      <div className="relative w-full max-w-[500px] h-[1080px] max-h-[95vh] mx-auto my-auto flex-shrink-0">
        {/* Phone Frame Bezel - Modern black smartphone design */}
        <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-b from-gray-900 via-black to-gray-900 shadow-[0_0_80px_rgba(0,0,0,0.9),0_30px_100px_rgba(0,0,0,0.7)] border-[12px] border-black overflow-hidden">
          {/* Top speaker/notch area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[45px] bg-black rounded-b-[22px] z-[60] flex items-center justify-center">
            {/* Speaker grille */}
            <div className="w-[80px] h-[5px] bg-gray-800 rounded-full" />
          </div>
          
          {/* Screen Content */}
          <div className="absolute inset-[12px] rounded-[3rem] overflow-hidden z-30">
            <div className="relative w-full h-full rounded-[3rem] overflow-hidden">
              {children}
            </div>
            {/* Home Indicator (for iPhone-style) - inside screen area */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[180px] h-[6px] bg-white/40 rounded-full z-[110] backdrop-blur-sm pointer-events-none" />
          </div>
        </div>
        
        {/* Subtle decorative glow effect around frame */}
        <div className="absolute inset-0 rounded-[3.5rem] pointer-events-none z-0">
          <div className="absolute -inset-1 rounded-[3.5rem] bg-gradient-to-br from-neon-pink/10 via-transparent to-neon-cyan/10 blur-3xl opacity-50" />
        </div>
      </div>
    </div>
  )
}
