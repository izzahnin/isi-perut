import { motion } from 'framer-motion'
import {
  ArrowRightLeft,
  Check,
  MapPin,
  MoreVertical,
  Pencil,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CATEGORY_THEMES } from '../../lib/category-theme'
import { buildGoogleMapsUrl } from '../../lib/maps-parser'
import { cn } from '../../lib/utils'
import type { Category, CategoryColorToken, Place } from '../../types/place'

interface PlaceCardProps {
  place: Place
  colorToken: CategoryColorToken
  categories?: Category[]
  canEdit?: boolean
  onToggleVisited?: (place: Place) => void
  onEdit?: (place: Place) => void
  onMoveToCategory?: (place: Place, targetCategoryId: string) => void
}

const NOTE_BADGE_STYLES = [
  'bg-mango/60 text-ink',
  'bg-cream-dark text-ink',
  'bg-pandan/25 text-ink',
  'bg-rose/20 text-ink',
]

export function PlaceCard({
  place,
  colorToken,
  categories = [],
  canEdit = true,
  onToggleVisited,
  onEdit,
  onMoveToCategory,
}: PlaceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const theme = CATEGORY_THEMES[colorToken]
  const hasArea = Boolean(place.area?.trim())
  const hasCoordinates = place.lat !== null && place.lng !== null
  const hasMapsInfo = hasCoordinates || Boolean(place.maps_url?.trim())
  const missingFields: string[] = []
  if (!hasArea) missingFields.push('Area')
  if (!hasMapsInfo) missingFields.push('Maps')
  const isIncomplete = missingFields.length > 0

  const mapsHref = buildGoogleMapsUrl({
    lat: place.lat,
    lng: place.lng,
    mapsUrl: place.maps_url,
    name: place.name,
  })
  const otherCategories = categories.filter((c) => c.id !== place.category_id)

  return (
    <article
      className={cn(
        'pop-card relative rounded-2xl p-4',
        place.is_visited && 'bg-cream-dark/45',
      )}
    >
      <div>
        {/* Top category color accent bar clipped to inner card radius so dropdown menu stays unclipped */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
          <div className={cn('h-1.5 w-full', theme.cardStripe)} />
        </div>

        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="min-w-0 flex-1">
            {(hasArea || place.notes.length > 0) && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {hasArea && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-ink px-2 py-0.5 text-[11px] font-bold text-cream">
                    <span>📍 {place.area}</span>
                  </span>
                )}
                {place.notes.map((note, noteIdx) => (
                  <span
                    key={`${place.id}-note-${note}`}
                    className={cn(
                      'rounded-full border border-ink px-2 py-0.5 text-[11px] font-bold',
                      NOTE_BADGE_STYLES[noteIdx % NOTE_BADGE_STYLES.length],
                    )}
                  >
                    {note}
                  </span>
                ))}
              </div>
            )}

            <h2 className="font-display text-lg font-extrabold leading-snug text-ink">
              {place.name}
            </h2>

            {canEdit && isIncomplete && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(place)}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-ink/60 bg-mango/45 px-2.5 py-0.5 text-[11px] font-bold text-ink hover:bg-mango"
              >
                <span>+ Lengkapi {missingFields.join(' & ')}</span>
              </button>
            )}
          </div>

          {/* Quick Move / Edit Menu (drag handle temporarily disabled) */}
          {canEdit && (
            <div className="relative flex shrink-0 items-center gap-1" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label={`Menu opsi ${place.name}`}
                aria-expanded={menuOpen}
                className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm hover:bg-cream-dark"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="pop-card absolute right-0 top-10 z-30 w-52 rounded-2xl p-1.5 shadow-pop-lg"
                >
                  {onEdit && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(place)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-ink hover:bg-cream-dark"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Edit Tempat</span>
                    </button>
                  )}

                  {otherCategories.length > 0 && onMoveToCategory && (
                    <>
                      <div className="my-1 border-t border-ink/15 px-2.5 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />
                          Pindah Kategori
                        </span>
                      </div>
                      {otherCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false)
                            onMoveToCategory(place, cat.id)
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-ink hover:bg-mango/50"
                        >
                          <span>{cat.emoji}</span>
                          <span className="truncate">Pindah ke {cat.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-ink/15 pt-3">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onToggleVisited?.(place)}
              aria-pressed={place.is_visited}
              className={cn(
                'pop-press inline-flex items-center gap-1.5 rounded-xl border-2 border-ink px-2.5 py-1.5 text-xs font-extrabold shadow-pop-sm',
                place.is_visited
                  ? cn(theme.stampBg, '-rotate-1')
                  : 'bg-paper text-ink hover:bg-cream-dark',
              )}
            >
              <Check
                className={cn(
                  'h-3.5 w-3.5',
                  place.is_visited ? 'opacity-100' : 'opacity-35',
                )}
                strokeWidth={3}
                aria-hidden="true"
              />
              <span>{place.is_visited ? 'Sudah Mampir!' : 'Belum Dicoba'}</span>
            </motion.button>

            <span className="text-[11px] font-semibold text-ink-muted">
              by {place.added_by}
            </span>
          </div>

          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'pop-press inline-flex items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-xs font-extrabold text-ink shadow-pop-sm',
              hasMapsInfo ? 'bg-pandan' : 'bg-cream-dark hover:bg-mango/60',
            )}
          >
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
            <span>{hasMapsInfo ? 'Gas Maps' : 'Cari Maps'}</span>
          </a>
        </div>
      </div>
    </article>
  )
}
