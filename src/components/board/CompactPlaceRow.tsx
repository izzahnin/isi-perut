import { Check, MapPin, Pencil } from 'lucide-react'
import { CATEGORY_THEMES } from '../../lib/category-theme'
import { buildGoogleMapsUrl } from '../../lib/maps-parser'
import { cn } from '../../lib/utils'
import type { CategoryColorToken, Place } from '../../types/place'

interface CompactPlaceRowProps {
  place: Place
  colorToken: CategoryColorToken
  categoryEmoji: string
  canEdit?: boolean
  onToggleVisited: (place: Place) => void
  onEdit: (place: Place) => void
}

export function CompactPlaceRow({
  place,
  colorToken,
  categoryEmoji,
  canEdit = true,
  onToggleVisited,
  onEdit,
}: CompactPlaceRowProps) {
  const theme = CATEGORY_THEMES[colorToken]
  const mapsHref = buildGoogleMapsUrl({
    lat: place.lat,
    lng: place.lng,
    mapsUrl: place.maps_url,
    name: place.name,
  })

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-pop-sm',
        place.is_visited && 'bg-cream-dark/55',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className={cn(
            'h-7 w-1.5 shrink-0 rounded-full',
            theme.cardStripe,
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" aria-hidden="true">
              {categoryEmoji}
            </span>
            <p className="truncate font-display text-sm font-extrabold text-ink">
              {place.name}
            </p>
          </div>
          <p className="truncate text-[11px] font-medium text-ink-muted">
            {place.area ? `📍 ${place.area}` : 'Area belum diisi'}
            {' • '}
            by {place.added_by}
            {place.notes.length > 0 ? ` • ${place.notes[0]}` : ''}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleVisited(place)}
          aria-label={
            place.is_visited
              ? `Tandai ${place.name} belum dicoba`
              : `Tandai ${place.name} sudah mampir`
          }
          aria-pressed={place.is_visited}
          className={cn(
            'pop-press flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink',
            place.is_visited
              ? cn(theme.stampBg)
              : 'bg-paper text-ink hover:bg-cream-dark',
          )}
        >
          <Check
            className={cn(
              'h-3.5 w-3.5',
              place.is_visited ? 'opacity-100' : 'opacity-35',
            )}
            strokeWidth={3}
          />
        </button>

        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buka ${place.name} di Google Maps`}
          className="pop-press flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-pandan text-ink"
        >
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
        </a>

        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(place)}
            aria-label={`Edit ${place.name}`}
            className="pop-press flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-cream-dark text-ink hover:bg-mango/60"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
