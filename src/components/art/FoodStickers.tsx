import type { CategoryColorToken } from '../../types/place'

export function FoodBowlSticker({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        fill="#FF3B30"
        stroke="#1C1917"
        strokeWidth="4"
      />
      <path
        d="M32 28c0-5 5-7 5-12M48 25c0-5 5-7 5-12M64 28c0-5 5-7 5-12"
        stroke="#FFFBF2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M23 48c0-13 11-20 25-20s25 7 25 20"
        fill="#FFB703"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M18 48h60c0 18-12 29-30 29S18 66 18 48Z"
        fill="#FFFBF2"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="59" r="3" fill="#1C1917" />
      <circle cx="58" cy="59" r="3" fill="#1C1917" />
      <path
        d="M42 64c2.5 3.5 9.5 3.5 12 0"
        stroke="#1C1917"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BobaDrinkSticker({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        fill="#FF8A00"
        stroke="#1C1917"
        strokeWidth="4"
      />
      <path
        d="M52 14l6 18"
        stroke="#1C1917"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M52 14l6 18"
        stroke="#00B86B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M28 34h40l-5 44H33l-5-44Z"
        fill="#FFFBF2"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M25 34h46"
        stroke="#1C1917"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="40" cy="68" r="3.5" fill="#1C1917" />
      <circle cx="50" cy="65" r="3.5" fill="#1C1917" />
      <circle cx="56" cy="70" r="3.5" fill="#1C1917" />
      <circle cx="41" cy="49" r="2.5" fill="#1C1917" />
      <circle cx="55" cy="49" r="2.5" fill="#1C1917" />
      <path
        d="M44 54c2 2.5 6 2.5 8 0"
        stroke="#1C1917"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CandleDinnerSticker({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        fill="#9B5DE5"
        stroke="#1C1917"
        strokeWidth="4"
      />
      <path
        d="M48 18c5 7 7 12 4 17-2.5 4-7.5 4-10 0-3-5 1-10 6-17Z"
        fill="#FFB703"
        stroke="#1C1917"
        strokeWidth="3"
      />
      <rect
        x="37"
        y="38"
        width="22"
        height="34"
        rx="5"
        fill="#FFFBF2"
        stroke="#1C1917"
        strokeWidth="3.5"
      />
      <path
        d="M26 74h44"
        stroke="#1C1917"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="28" r="3" fill="#FFB703" />
      <circle cx="72" cy="30" r="3.5" fill="#FFFBF2" />
    </svg>
  )
}

export function FreshLeafSticker({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="84"
        height="84"
        rx="22"
        fill="#00B86B"
        stroke="#1C1917"
        strokeWidth="4"
      />
      <path
        d="M28 66c2-26 20-40 42-38-2 22-16 38-42 38Z"
        fill="#FFFBF2"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M26 68L56 40"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CategorySticker({
  colorToken,
  className,
}: {
  colorToken: CategoryColorToken
  className?: string
}) {
  switch (colorToken) {
    case 'orange':
      return <BobaDrinkSticker className={className} />
    case 'purple':
      return <CandleDinnerSticker className={className} />
    case 'green':
      return <FreshLeafSticker className={className} />
    case 'red':
    default:
      return <FoodBowlSticker className={className} />
  }
}

export function EmptyPlateDoodle({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="62"
        r="44"
        fill="#FFF3DA"
        stroke="#1C1917"
        strokeWidth="4"
      />
      <circle
        cx="60"
        cy="62"
        r="28"
        fill="#FFFFFF"
        stroke="#1C1917"
        strokeWidth="3"
        strokeDasharray="6 6"
      />
      <circle cx="48" cy="57" r="3.5" fill="#1C1917" />
      <circle cx="72" cy="57" r="3.5" fill="#1C1917" />
      <path
        d="M51 71c4-4 14-4 18 0"
        stroke="#1C1917"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M92 24l6-6M100 34h8M20 30l-5-5"
        stroke="#FF8A00"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
