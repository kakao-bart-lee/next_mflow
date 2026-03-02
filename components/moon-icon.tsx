interface MoonIconProps {
  className?: string
  size?: number
}

export function MoonIcon({ className = "", size = 80 }: MoonIconProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center animate-float ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow halo */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 25%, transparent) 0%, transparent 70%)",
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="moonGlow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        {/* Moon crescent */}
        <path
          d="M40 8C22.327 8 8 22.327 8 40C8 57.673 22.327 72 40 72C57.673 72 72 57.673 72 40C72 35.582 71.045 31.383 69.334 27.587C65.477 29.468 61.116 30.5 56.5 30.5C40.208 30.5 27 17.292 27 1C27 0.665 27.006 0.331 27.019 0C22.108 2.109 17.846 5.524 14.601 9.83"
          fill="url(#moonGlow)"
          stroke="var(--primary)"
          strokeWidth="0.5"
          strokeOpacity="0.6"
        />
        {/* Simpler crescent using clip approach */}
        <circle cx="40" cy="40" r="28" fill="url(#moonGlow)" />
        <circle
          cx="52"
          cy="30"
          r="22"
          fill="var(--background)"
          fillOpacity="0.85"
        />
        {/* Star dots */}
        <circle cx="20" cy="28" r="1.5" fill="var(--primary)" opacity="0.7" />
        <circle cx="62" cy="55" r="1" fill="var(--primary)" opacity="0.5" />
        <circle cx="15" cy="52" r="1" fill="var(--ring)" opacity="0.6" />
      </svg>
    </div>
  )
}
