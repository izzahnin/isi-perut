import { AnimatePresence, motion } from 'framer-motion'
import { Dices, MapPin, RotateCw, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_THEMES } from '../../lib/category-theme'
import { triggerHaptic } from '../../lib/dnd-config'
import { buildGoogleMapsUrl } from '../../lib/maps-parser'
import { cn } from '../../lib/utils'
import type { Category, Place } from '../../types/place'
import { ALL_CATEGORIES_ID } from '../board/CategoryTabs'

interface SpinWheelModalProps {
  isOpen: boolean
  categories: Category[]
  places: Place[]
  initialCategoryId: string
  onClose: () => void
}

export function SpinWheelModal({
  isOpen,
  categories,
  places,
  initialCategoryId,
  onClose,
}: SpinWheelModalProps) {
  const [scopeCategoryId, setScopeCategoryId] = useState<string>(
    initialCategoryId || ALL_CATEGORIES_ID,
  )
  const [onlyUnvisited, setOnlyUnvisited] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null)
  const [hasWinner, setHasWinner] = useState(false)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      setIsSpinning(false)
      return
    }
    setScopeCategoryId(initialCategoryId || ALL_CATEGORIES_ID)
    setHasWinner(false)
    setCurrentPlace(null)
  }, [isOpen, initialCategoryId])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const pool = useMemo(() => {
    return places.filter((p) => {
      if (
        scopeCategoryId !== ALL_CATEGORIES_ID &&
        p.category_id !== scopeCategoryId
      ) {
        return false
      }
      if (onlyUnvisited && p.is_visited) return false
      return true
    })
  }, [places, scopeCategoryId, onlyUnvisited])

  const startSpin = () => {
    if (pool.length === 0 || isSpinning) return
    setIsSpinning(true)
    setHasWinner(false)

    const totalSteps = 22
    let step = 0
    const winnerIndex = Math.floor(Math.random() * pool.length)

    const tick = () => {
      step += 1
      const progress = step / totalSteps
      const pick =
        step >= totalSteps
          ? pool[winnerIndex]
          : pool[Math.floor(Math.random() * pool.length)]

      setCurrentPlace(pick)
      triggerHaptic(step >= totalSteps ? 25 : 8)

      if (step >= totalSteps) {
        setIsSpinning(false)
        setHasWinner(true)
        return
      }

      // Decelerate from 55ms -> 260ms like a slot/roulette wheel
      const delay = Math.round(55 + progress * progress * 210)
      timerRef.current = window.setTimeout(tick, delay)
    }

    tick()
  }

  const currentCat = currentPlace
    ? categoryMap.get(currentPlace.category_id)
    : undefined
  const currentTheme = CATEGORY_THEMES[currentCat?.color_token ?? 'red']

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="spinwheel-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/55 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mango px-3 py-1 text-xs font-extrabold text-ink shadow-pop-sm">
                <Dices className="h-3.5 w-3.5" aria-hidden="true" />
                <span>RANDOM PICK / GACHA</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Gacha"
                className="pop-press flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2
              id="spinwheel-title"
              className="mt-3 font-display text-2xl font-extrabold text-ink"
            >
              Bingung mau ke mana?
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-ink-muted">
              Pilih kategori lalu putar roda untuk menentukan destinasi!
            </p>

            {/* Category scope selector */}
            <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => setScopeCategoryId(ALL_CATEGORIES_ID)}
                className={cn(
                  'pop-press shrink-0 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold',
                  scopeCategoryId === ALL_CATEGORIES_ID
                    ? 'bg-ink text-cream shadow-pop-sm'
                    : 'bg-paper text-ink',
                )}
              >
                🍽️ Semua
              </button>
              {categories.map((cat) => {
                const selected = scopeCategoryId === cat.id
                const theme = CATEGORY_THEMES[cat.color_token]
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setScopeCategoryId(cat.id)}
                    className={cn(
                      'pop-press shrink-0 rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold',
                      selected
                        ? cn(theme.pillActive, 'shadow-pop-sm')
                        : 'bg-paper text-ink',
                    )}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                )
              })}
            </div>

            <label className="mt-2.5 flex cursor-pointer items-center justify-between rounded-xl border border-ink/25 bg-paper px-3 py-2 text-xs font-bold text-ink">
              <span>Hanya yang belum dicoba ({pool.length} pilihan)</span>
              <input
                type="checkbox"
                disabled={isSpinning}
                checked={onlyUnvisited}
                onChange={(e) => setOnlyUnvisited(e.target.checked)}
                className="h-4 w-4 accent-pandan"
              />
            </label>

            {/* Slot-machine display */}
            <div className="pop-card mt-4 overflow-hidden rounded-2xl bg-paper p-4 text-center">
              {currentPlace ? (
                <motion.div
                  key={`${currentPlace.id}-${hasWinner ? 'win' : 'roll'}`}
                  initial={hasWinner ? { scale: 0.85, rotate: -2 } : { y: -8, opacity: 0.7 }}
                  animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="space-y-2"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-extrabold shadow-pop-sm bg-cream-dark">
                    <span>{currentCat?.emoji ?? '🍽️'}</span>
                    <span>{currentCat?.name}</span>
                    {hasWinner && (
                      <span className="inline-flex items-center gap-0.5 text-tomato">
                        <Sparkles className="h-3 w-3" /> TERPILIH!
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-extrabold text-ink">
                    {currentPlace.name}
                  </h3>

                  <p className="text-xs font-semibold text-ink-muted">
                    {currentPlace.area ? `📍 ${currentPlace.area}` : 'Makassar'}
                    {currentPlace.notes.length > 0
                      ? ` • ${currentPlace.notes.join(', ')}`
                      : ''}
                  </p>

                  {hasWinner && (
                    <div className="pt-2">
                      <a
                        href={buildGoogleMapsUrl({
                          lat: currentPlace.lat,
                          lng: currentPlace.lng,
                          mapsUrl: currentPlace.maps_url,
                          name: currentPlace.name,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'pop-press inline-flex items-center gap-1.5 rounded-xl border-2 border-ink px-4 py-2 text-xs font-extrabold shadow-pop-sm',
                          currentTheme.stampBg,
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Gas Maps ke Sini!</span>
                      </a>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="py-5">
                  <p className="font-display text-lg font-extrabold text-ink">
                    Siap diacak! 🎰
                  </p>
                  <p className="mt-1 text-xs font-medium text-ink-muted">
                    Ada {pool.length} tempat siap dipilih secara acak.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={pool.length === 0 || isSpinning}
              onClick={startSpin}
              className="pop-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-tomato px-4 py-3 font-display text-sm font-extrabold text-white shadow-pop disabled:opacity-50"
            >
              <RotateCw
                className={cn('h-4 w-4', isSpinning && 'animate-spin')}
                aria-hidden="true"
              />
              <span>
                {isSpinning
                  ? 'Mengacak...'
                  : hasWinner
                    ? 'Putar Lagi!'
                    : 'Putar Gacha!'}
              </span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
