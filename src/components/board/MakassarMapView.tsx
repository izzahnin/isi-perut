import { Compass, ExternalLink, MapPin, Minus, Plus } from 'lucide-react'
import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { CATEGORY_THEMES } from '../../lib/category-theme'
import { buildGoogleMapsUrl } from '../../lib/maps-parser'
import { cn } from '../../lib/utils'
import type { Category, Place } from '../../types/place'

interface MakassarMapViewProps {
  places: Place[]
  categories: Category[]
  onEditPlace: (place: Place) => void
}

const MAKASSAR_CENTER = { lat: -5.1477, lng: 119.424 }
const TILE_SIZE = 256

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const x = ((lng + 180) / 360) * scale
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  return { x, y }
}

function worldToLatLng(worldX: number, worldY: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom
  const lng = (worldX / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * worldY) / scale
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  }
}

export function MakassarMapView({
  places,
  categories,
  onEditPlace,
}: MakassarMapViewProps) {
  const [zoom, setZoom] = useState(13)
  const [center, setCenter] = useState(MAKASSAR_CENTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tilesFailed, setTilesFailed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const panStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startWorldX: number
    startWorldY: number
  } | null>(null)

  const mappablePlaces = useMemo(
    () => places.filter((p) => p.lat !== null && p.lng !== null),
    [places],
  )

  const unpinnedPlaces = useMemo(
    () => places.filter((p) => p.lat === null || p.lng === null),
    [places],
  )

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const selectedPlace = useMemo(
    () =>
      mappablePlaces.find((p) => p.id === selectedId) ??
      mappablePlaces[0] ??
      null,
    [mappablePlaces, selectedId],
  )

  const mapWidth = 640
  const mapHeight = 360
  const centerWorld = latLngToWorld(center.lat, center.lng, zoom)

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    panStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWorldX: centerWorld.x,
      startWorldY: centerWorld.y,
    }
    setIsPanning(true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const pan = panStateRef.current
    if (!pan || pan.pointerId !== e.pointerId) return
    const dx = e.clientX - pan.startX
    const dy = e.clientY - pan.startY
    const nextCenter = worldToLatLng(
      pan.startWorldX - dx,
      pan.startWorldY - dy,
      zoom,
    )
    setCenter(nextCenter)
  }

  const endPan = (e: PointerEvent<HTMLDivElement>) => {
    const pan = panStateRef.current
    if (!pan || pan.pointerId !== e.pointerId) return
    panStateRef.current = null
    setIsPanning(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const tiles = useMemo(() => {
    const maxTile = 2 ** zoom
    const centerTileX = Math.floor(centerWorld.x / TILE_SIZE)
    const centerTileY = Math.floor(centerWorld.y / TILE_SIZE)
    const offsetX = mapWidth / 2 - centerWorld.x
    const offsetY = mapHeight / 2 - centerWorld.y

    const result: {
      key: string
      url: string
      left: number
      top: number
    }[] = []

    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) {
        const tx = centerTileX + dx
        const ty = centerTileY + dy
        if (ty < 0 || ty >= maxTile) continue
        const wrappedX = ((tx % maxTile) + maxTile) % maxTile
        result.push({
          key: `${zoom}-${wrappedX}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          left: tx * TILE_SIZE + offsetX,
          top: ty * TILE_SIZE + offsetY,
        })
      }
    }
    return result
  }, [centerWorld.x, centerWorld.y, zoom])

  const selectedCategory = selectedPlace
    ? categoryMap.get(selectedPlace.category_id)
    : undefined

  return (
    <div className="space-y-3.5">
      <div className="pop-card relative isolate z-0 overflow-hidden rounded-3xl bg-cream-dark">
        {/* Docked Map Toolbar (stays cleanly inside map card, never floats over sticky header or pins) */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-paper px-3.5 py-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-mango/60 px-2.5 py-1 text-xs font-extrabold text-ink">
            <span>{mappablePlaces.length} Pin</span>
            <span className="text-ink/60">•</span>
            <span>Geser peta</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(11, z - 1))}
              aria-label="Perkecil peta"
              className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm hover:bg-cream-dark"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(16, z + 1))}
              aria-label="Perbesar peta"
              className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm hover:bg-cream-dark"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCenter(MAKASSAR_CENTER)
                setZoom(13)
              }}
              aria-label="Pusatkan ke Makassar"
              className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-mango text-ink shadow-pop-sm"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Pannable Map viewport */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          className={cn(
            'relative h-[360px] w-full touch-none overflow-hidden select-none',
            isPanning ? 'cursor-grabbing' : 'cursor-grab',
          )}
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(28,25,23,0.12) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          {!tilesFailed && (
            <div
              className="pointer-events-none absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: mapWidth, height: mapHeight }}
            >
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  draggable={false}
                  onError={() => setTilesFailed(true)}
                  className="absolute max-w-none opacity-90 saturate-90"
                  style={{ left: tile.left, top: tile.top }}
                />
              ))}
            </div>
          )}

          {/* Category Pin Markers (only accurate lat/lng from Google Maps links) */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: mapWidth, height: mapHeight }}
          >
            {mappablePlaces.map((place) => {
              const world = latLngToWorld(
                place.lat as number,
                place.lng as number,
                zoom,
              )
              const left = mapWidth / 2 + (world.x - centerWorld.x)
              const top = mapHeight / 2 + (world.y - centerWorld.y)
              const cat = categoryMap.get(place.category_id)
              const theme = CATEGORY_THEMES[cat?.color_token ?? 'red']
              const isSelected = selectedPlace?.id === place.id

              return (
                <button
                  key={place.id}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setSelectedId(place.id)}
                  style={{ left, top }}
                  title={place.name}
                  aria-label={`Pilih ${place.name}`}
                  className={cn(
                    'pop-press pointer-events-auto absolute -translate-x-1/2 -translate-y-full rounded-full border-2 border-ink px-2 py-1 text-xs font-extrabold shadow-pop-sm transition-transform',
                    theme.pillActive,
                    isSelected && 'z-20 scale-125 ring-2 ring-ink',
                  )}
                >
                  <span>{cat?.emoji ?? '📍'}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Pinned Place Preview */}
      {selectedPlace && (
        <div className="pop-card flex items-center justify-between gap-3 rounded-2xl p-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{selectedCategory?.emoji ?? '📍'}</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-muted">
                {selectedCategory?.name}
                {selectedPlace.area ? ` • ${selectedPlace.area}` : ''}
              </span>
            </div>
            <h3 className="mt-0.5 truncate font-display text-base font-extrabold text-ink">
              {selectedPlace.name}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEditPlace(selectedPlace)}
              className="pop-press rounded-xl border-2 border-ink bg-paper px-2.5 py-2 text-xs font-extrabold text-ink shadow-pop-sm"
            >
              Edit
            </button>
            <a
              href={buildGoogleMapsUrl({
                lat: selectedPlace.lat,
                lng: selectedPlace.lng,
                mapsUrl: selectedPlace.maps_url,
                name: selectedPlace.name,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="pop-press inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-pandan px-3 py-2 text-xs font-extrabold text-ink shadow-pop-sm"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Gas Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* Places with Google Maps URL that don't have a coordinate pin yet */}
      {unpinnedPlaces.length > 0 && (
        <div className="pop-card rounded-2xl p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-extrabold text-ink">
                Buka di Google Maps ({unpinnedPlaces.length} tempat)
              </h3>
              <p className="text-[11px] font-medium text-ink-muted">
                Buka link Maps lalu tempel URL yang ada <code className="font-bold">@lat,lng</code> untuk menyematkan pin akurat di peta.
              </p>
            </div>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {unpinnedPlaces.map((place) => {
              const cat = categoryMap.get(place.category_id)
              const href = buildGoogleMapsUrl({
                lat: place.lat,
                lng: place.lng,
                mapsUrl: place.maps_url,
                name: place.name,
              })
              return (
                <div
                  key={place.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-ink/20 bg-cream px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-ink">
                      {cat?.emoji} {place.name}
                    </p>
                    {place.area && (
                      <p className="truncate text-[11px] font-medium text-ink-muted">
                        📍 {place.area}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditPlace(place)}
                      className="rounded-lg border border-ink bg-mango/60 px-2 py-1 text-[11px] font-extrabold text-ink hover:bg-mango"
                    >
                      Tempel Pin
                    </button>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-ink bg-pandan px-2.5 py-1 text-[11px] font-extrabold text-ink"
                    >
                      <span>Maps</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
