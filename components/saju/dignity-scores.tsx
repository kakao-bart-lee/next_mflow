"use client"

const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉", MOON: "☽", MERCURY: "☿", VENUS: "♀", MARS: "♂",
  JUPITER: "♃", SATURN: "♄",
}

interface DignityScoreEntry {
  body: string
  score: number
  sign?: string
  degreeInSign?: number
}

interface DignityScoresProps {
  title: string
  subtitle?: string
  scores: DignityScoreEntry[]
  maxScore?: number
  minScore?: number
  className?: string
}

export function DignityScores({
  title,
  subtitle,
  scores,
  maxScore = 10,
  minScore = -10,
  className,
}: DignityScoresProps) {
  const range = maxScore - minScore
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map((entry) => {
          const symbol = PLANET_SYMBOLS[entry.body] ?? entry.body
          const isPositive = entry.score >= 0
          const barWidth = (Math.abs(entry.score) / range) * 100
          const zeroOffset = ((0 - minScore) / range) * 100

          return (
            <div key={entry.body} className="flex items-center gap-2">
              {/* Planet symbol */}
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs">
                {symbol}
              </span>

              {/* Bar container */}
              <div className="relative flex-1 h-5 rounded bg-muted/40">
                {/* Zero line */}
                <div
                  className="absolute top-0 h-full w-px bg-border"
                  style={{ left: `${zeroOffset}%` }}
                />

                {/* Score bar */}
                <div
                  className={`absolute top-0.5 h-4 rounded-sm transition-all duration-300 ${
                    isPositive
                      ? "bg-primary/60"
                      : "bg-accent/60"
                  }`}
                  style={{
                    left: isPositive ? `${zeroOffset}%` : `${zeroOffset - barWidth}%`,
                    width: `${Math.max(barWidth, 1)}%`,
                  }}
                />
              </div>

              {/* Score label */}
              <span
                className={`w-10 text-right text-xs font-mono ${
                  isPositive ? "text-primary" : "text-accent"
                }`}
              >
                {entry.score > 0 ? "+" : ""}
                {entry.score}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
