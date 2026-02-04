import { MessageSquare } from "lucide-react-native"
import { MotiView } from "moti"
import * as React from "react"
import { StyleSheet, View } from "react-native"
import Svg, { Line } from "react-native-svg"

import { useTheme } from "@/theme/theme-provider"

function DarkNetworkBackground({
  width,
  height,
  theme,
}: {
  width: number
  height: number
  theme: ReturnType<typeof useTheme>["theme"]
}) {
  // Generate network nodes and connections
  const nodes = React.useMemo(() => {
    const count = 24
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (i * 37) % width + (i % 3) * 28,
      y: (i * 41) % height + (i % 4) * 32,
      color: i % 2 === 0 ? theme.colors.neonPink : theme.colors.neonCyan,
      delay: i * 80,
    }))
  }, [width, height, theme])

  const connections = React.useMemo(() => {
    const conns: Array<{ from: number; to: number; color: string }> = []
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i]
      if (!node) continue
      // Connect to nearby nodes
      for (let j = i + 1; j < Math.min(i + 4, nodes.length); j += 1) {
        const other = nodes[j]
        if (!other) continue
        const dist = Math.sqrt(
          Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
        )
        if (dist < 180) {
          conns.push({
            from: i,
            to: j,
            color: node.color === theme.colors.neonPink ? `${theme.colors.neonPink}44` : `${theme.colors.neonCyan}44`,
          })
        }
      }
    }
    return conns
  }, [nodes, theme])

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.background }]} />

      {/* Network lines */}
      <Svg style={StyleSheet.absoluteFillObject} width={width} height={height}>
        {connections.map((conn, idx) => {
          const from = nodes[conn.from]
          const to = nodes[conn.to]
          if (!from || !to) return null
          return (
            <Line
              key={`line-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={conn.color}
              strokeWidth="1"
              opacity={0.35}
            />
          )
        })}
      </Svg>

      {/* Animated nodes */}
      {nodes.map((node) => (
        <MotiView
          key={node.id}
          from={{ opacity: 0.2, scale: 0.8 }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.2, 0.9] }}
          transition={{
            type: "timing",
            duration: 3000 + (node.id % 3) * 500,
            loop: true,
            delay: node.delay,
          }}
          style={[
            styles.node,
            {
              left: node.x - 4,
              top: node.y - 4,
              backgroundColor: node.color,
            },
          ]}
        />
      ))}

      {/* Scattered chat bubble icons */}
      {Array.from({ length: 8 }).map((_, i) => {
        const isPink = i % 2 === 0
        const left = `${(i * 23) % 100}%` as const
        const top = `${(i * 31) % 100}%` as const
        return (
          <MotiView
            key={`bubble-${i}`}
            from={{ opacity: 0.15, rotate: "0deg", scale: 0.8 }}
            animate={{
              opacity: [0.15, 0.4, 0.15],
              rotate: ["0deg", "15deg", "0deg"],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              type: "timing",
              duration: 4000 + (i % 3) * 600,
              loop: true,
              delay: i * 200,
            }}
            style={[
              styles.bubbleIcon,
              {
                left,
                top,
              },
            ]}
          >
            <MessageSquare
              size={28}
              color={isPink ? theme.colors.neonPink : theme.colors.neonCyan}
              opacity={0.25}
            />
          </MotiView>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  node: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bubbleIcon: {
    position: "absolute",
  },
})
