import type { CategoryColorToken } from '../types/place'

export interface CategoryTheme {
  pillActive: string
  pillBadge: string
  bannerAccent: string
  cardStripe: string
  stampBg: string
}

/**
 * Maps category color tokens to WCAG AA-compliant Pop-Art Tailwind classes.
 */
export const CATEGORY_THEMES: Record<CategoryColorToken, CategoryTheme> = {
  red: {
    pillActive: 'bg-tomato text-white',
    pillBadge: 'bg-white/20 text-white',
    bannerAccent: 'bg-tomato text-white',
    cardStripe: 'bg-chili',
    stampBg: 'bg-mango text-ink',
  },
  orange: {
    pillActive: 'bg-tangerine text-ink',
    pillBadge: 'bg-ink/15 text-ink',
    bannerAccent: 'bg-tangerine text-ink',
    cardStripe: 'bg-tangerine',
    stampBg: 'bg-mango text-ink',
  },
  green: {
    pillActive: 'bg-pandan text-ink',
    pillBadge: 'bg-ink/15 text-ink',
    bannerAccent: 'bg-pandan text-ink',
    cardStripe: 'bg-pandan',
    stampBg: 'bg-mango text-ink',
  },
  purple: {
    pillActive: 'bg-berry text-white',
    pillBadge: 'bg-white/20 text-white',
    bannerAccent: 'bg-berry text-white',
    cardStripe: 'bg-berry',
    stampBg: 'bg-mango text-ink',
  },
}
