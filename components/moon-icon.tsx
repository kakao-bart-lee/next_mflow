"use client"

interface MoonIconProps {
  size?: number
  className?: string
}

export function MoonIcon({ size = 48, className = "" }: MoonIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" fill="currentColor" opacity="0.15" />
      <path
        d="M30 8C22 8 16 16 16 24s6 16 14 16c-2 0-4-1-6-2-6-4-10-11-10-18S10 6 16 2c2-1 4-2 6-2h8z"
        fill="currentColor"
        opacity="0.3"
      />
      <circle cx="20" cy="18" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="28" cy="28" r="1.5" fill="currentColor" opacity="0.15" />
      <circle cx="22" cy="30" r="1" fill="currentColor" opacity="0.1" />
    </svg>
  )
}
