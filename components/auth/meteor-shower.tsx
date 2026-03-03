"use client"

import { useEffect, useRef } from "react"

export function MeteorShower() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number

    interface Meteor {
      x: number
      y: number
      length: number
      speed: number
      opacity: number
      angle: number
    }

    let meteors: Meteor[] = []

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function spawnMeteor(): Meteor {
      if (!canvas) return { x: 0, y: 0, length: 80, speed: 4, opacity: 0.6, angle: 0.8 }
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      return {
        x: Math.random() * w * 1.2,
        y: -20 - Math.random() * h * 0.3,
        length: 60 + Math.random() * 80,
        speed: 3 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.5,
        angle: 0.6 + Math.random() * 0.4,
      }
    }

    function init() {
      meteors = Array.from({ length: 5 }, spawnMeteor)
    }

    function animate() {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      for (const m of meteors) {
        const dx = Math.cos(m.angle) * m.speed
        const dy = Math.sin(m.angle) * m.speed
        m.x += dx
        m.y += dy

        // Draw meteor trail
        const tailX = m.x - Math.cos(m.angle) * m.length
        const tailY = m.y - Math.sin(m.angle) * m.length
        const gradient = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
        gradient.addColorStop(0, `rgba(255,255,255,0)`)
        gradient.addColorStop(1, `rgba(255,255,255,${m.opacity})`)
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Head glow
        ctx.beginPath()
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${m.opacity})`
        ctx.fill()

        // Reset if off-screen
        if (m.y > h + 50 || m.x > w + 50) {
          Object.assign(m, spawnMeteor())
        }
      }

      // Occasionally spawn new meteor
      if (Math.random() < 0.02 && meteors.length < 8) {
        meteors.push(spawnMeteor())
      }

      rafId = requestAnimationFrame(animate)
    }

    resize()
    init()
    animate()

    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
