"use client"

import { useEffect, useRef } from "react"

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  twinkleOffset: number
}

interface Raindrop {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
}

function getThemeColors(canvas: HTMLCanvasElement): {
  goldR: number; goldG: number; goldB: number
  lavR: number; lavG: number; lavB: number
  rainR: number; rainG: number; rainB: number
} {
  const style = getComputedStyle(canvas)
  return {
    goldR: parseInt(style.getPropertyValue("--star-gold-r").trim() || "233"),
    goldG: parseInt(style.getPropertyValue("--star-gold-g").trim() || "180"),
    goldB: parseInt(style.getPropertyValue("--star-gold-b").trim() || "76"),
    lavR: parseInt(style.getPropertyValue("--star-lavender-r").trim() || "178"),
    lavG: parseInt(style.getPropertyValue("--star-lavender-g").trim() || "164"),
    lavB: parseInt(style.getPropertyValue("--star-lavender-b").trim() || "212"),
    rainR: parseInt(style.getPropertyValue("--rain-r").trim() || "167"),
    rainG: parseInt(style.getPropertyValue("--rain-g").trim() || "199"),
    rainB: parseInt(style.getPropertyValue("--rain-b").trim() || "231"),
  }
}

/** 4-pointed star via quadraticCurveTo — crisp spike shape */
function drawSharpStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const outerR = size * 1.5
  const innerR = size * 0.3
  ctx.beginPath()
  // top spike
  ctx.moveTo(x, y - outerR)
  ctx.quadraticCurveTo(x + innerR, y - innerR, x + outerR, y)
  ctx.quadraticCurveTo(x + innerR, y + innerR, x, y + outerR)
  ctx.quadraticCurveTo(x - innerR, y + innerR, x - outerR, y)
  ctx.quadraticCurveTo(x - innerR, y - innerR, x, y - outerR)
  ctx.closePath()
  ctx.fill()
}

/** Small 4-spike star for medium-sized stars */
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const spikes = 4
  const outerR = size * 1.2
  const innerR = size * 0.4
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    if (i === 0) ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
    else ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
  }
  ctx.closePath()
  ctx.fill()
}

export function StarfieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number
    let stars: Star[] = []
    let raindrops: Raindrop[] = []
    let colors = getThemeColors(canvas)

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
      initRaindrops()
    }

    function initStars() {
      if (!canvas) return
      const count = Math.floor((canvas.width * canvas.height) / 8000)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.8,
        speed: 0.1 + Math.random() * 0.3,
        twinkleOffset: Math.random() * Math.PI * 2,
      }))
    }

    function initRaindrops() {
      if (!canvas) return
      const count = Math.floor(canvas.width / 20)
      raindrops = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 8 + Math.random() * 15,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.05 + Math.random() * 0.15,
      }))
    }

    let time = 0
    function animate() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01

      // Draw stars
      for (let idx = 0; idx < stars.length; idx++) {
        const star = stars[idx]
        const twinkle = Math.sin(time * star.speed + star.twinkleOffset)
        const opacity = star.opacity * (0.4 + twinkle * 0.6)

        // Color assignment: gold / lavender / white
        let r: number, g: number, b: number
        const isGolden = star.size > 1.5
        if (isGolden) {
          r = colors.goldR; g = colors.goldG; b = colors.goldB
        } else if (idx % 3 === 1) {
          r = colors.lavR; g = colors.lavG; b = colors.lavB
        } else if (idx % 3 === 2) {
          r = 255; g = 255; b = 255
        } else {
          r = colors.goldR; g = colors.goldG; b = colors.goldB
        }

        if (star.size > 1.8) {
          // Large stars: sharp 4-pointed star + shadowBlur glow
          ctx.save()
          ctx.shadowBlur = 8
          ctx.shadowColor = `rgba(${r},${g},${b},${opacity * 0.6})`
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
          drawSharpStar(ctx, star.x, star.y, star.size)
          ctx.restore()
        } else if (star.size > 1.2) {
          // Medium stars: small spike shape
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
          drawStar(ctx, star.x, star.y, star.size)
        } else {
          // Small stars: simple circle
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw raindrops
      for (const drop of raindrops) {
        drop.y += drop.speed
        if (drop.y > canvas.height) {
          drop.y = -drop.length
          drop.x = Math.random() * canvas.width
        }
        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x, drop.y + drop.length)
        ctx.strokeStyle = `rgba(${colors.rainR},${colors.rainG},${colors.rainB},${drop.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      rafId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    const observer = new MutationObserver(() => {
      colors = getThemeColors(canvas)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette"],
    })

    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  )
}
