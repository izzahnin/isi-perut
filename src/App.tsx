import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  Dices,
  LayoutGrid,
  List,
  Map as MapIcon,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  WifiOff,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CategorySticker,
  EmptyPlateDoodle,
} from './components/art/FoodStickers'
import {
  ALL_CATEGORIES_ID,
  CategoryTabs,
} from './components/board/CategoryTabs'
import { CompactPlaceRow } from './components/board/CompactPlaceRow'
import { MakassarMapView } from './components/board/MakassarMapView'
import { PlaceCard } from './components/board/PlaceCard'
import {
  SearchFilterBar,
  type SortOrder,
  type VisitFilter,
} from './components/board/SearchFilterBar'
import { AddCategoryModal } from './components/modals/AddCategoryModal'
import { AddPlaceDrawer } from './components/modals/AddPlaceDrawer'
import { AdminEditorsModal } from './components/modals/AdminEditorsModal'
import {
  FriendIdentityModal,
  getSavedCanEdit,
  getSavedFriendName,
  saveFriendSession,
} from './components/modals/FriendIdentityModal'
import { SpinWheelModal } from './components/modals/SpinWheelModal'
import {
  WhatsNewModal,
  shouldShowWhatsNew,
} from './components/modals/WhatsNewModal'
import { PWAInstallBanner } from './components/ui/PWAInstallBanner'
import { CATEGORY_THEMES } from './lib/category-theme'
import { triggerHaptic } from './lib/dnd-config'
import {
  createCategory,
  createPlace,
  deletePlace,
  fetchCategories,
  fetchPlaces,
  isFriendAllowedToEdit,
  isSupabaseConfigured,
  persistPlaceOrder,
  setLocalVisited,
  subscribeToBoardChanges,
  updatePlace,
} from './lib/supabase'
import { cn } from './lib/utils'
import type {
  Category,
  CityId,
  NewCategoryInput,
  NewPlaceInput,
  Place,
  UpdatePlaceInput,
} from './types/place'

type ViewMode = 'list' | 'compact' | 'map'
type CityFilter = 'makassar' | 'jakarta' | 'all'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [cityFilter, setCityFilter] = useState<CityFilter>('makassar')
  const [query, setQuery] = useState('')
  const [visitFilter, setVisitFilter] = useState<VisitFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [addedByFilter, setAddedByFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  const [friendName, setFriendName] = useState<string>(() =>
    getSavedFriendName(),
  )
  const [canEdit, setCanEdit] = useState<boolean>(() => getSavedCanEdit())
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState<boolean>(
    () => !getSavedFriendName(),
  )
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState<boolean>(
    () => Boolean(getSavedFriendName()) && shouldShowWhatsNew(),
  )

  const [isPlaceDrawerOpen, setIsPlaceDrawerOpen] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)

  const syncFriendEditPermission = useCallback(async (nameToCheck: string) => {
    if (!nameToCheck || nameToCheck.toLowerCase() === 'tamu') {
      setCanEdit(false)
      return
    }
    const allowed = await isFriendAllowedToEdit(nameToCheck)
    setCanEdit(allowed)
    saveFriendSession(nameToCheck, allowed)
  }, [])

  useEffect(() => {
    if (friendName) {
      void syncFriendEditPermission(friendName)
    }
  }, [friendName, syncFriendEditPermission])

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
    }, 2600)
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadInitial() {
      try {
        const [loadedCategories, loadedPlaces] = await Promise.all([
          fetchCategories(),
          fetchPlaces(),
        ])
        if (!mounted) return
        setCategories(loadedCategories)
        setPlaces(loadedPlaces)
        if (loadedCategories.length > 0) {
          setActiveCategoryId((prev) => prev || loadedCategories[0].id)
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadInitial()

    const unsubscribeRealtime = subscribeToBoardChanges({
      onPlacesChanged: () => {
        void fetchPlaces().then((latest) => {
          if (mounted) setPlaces(latest)
        })
      },
      onCategoriesChanged: () => {
        void fetchCategories().then((latest) => {
          if (mounted) setCategories(latest)
        })
      },
      onRemotePlaceEvent: (eventType, placeName) => {
        if (eventType === 'INSERT' && placeName) {
          showToast(`Teman menambahkan "${placeName}"`)
        } else if (eventType === 'UPDATE' && placeName) {
          showToast(`"${placeName}" diperbarui teman`)
        }
      },
    })

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      mounted = false
      unsubscribeRealtime()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [showToast])

  const isAllCategories = activeCategoryId === ALL_CATEGORIES_ID

  const activeCategory = useMemo(
    () =>
      isAllCategories
        ? undefined
        : (categories.find((c) => c.id === activeCategoryId) ?? categories[0]),
    [categories, activeCategoryId, isAllCategories],
  )

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const cityScopedPlaces = useMemo(() => {
    if (cityFilter === 'all') return places
    return places.filter((p) => (p.city ?? 'makassar') === cityFilter)
  }, [places, cityFilter])

  const addedByOptions = useMemo(() => {
    const names = new Set<string>()
    for (const p of cityScopedPlaces) {
      if (p.added_by?.trim()) names.add(p.added_by.trim().toLowerCase())
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [cityScopedPlaces])

  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const place of cityScopedPlaces) {
      map[place.category_id] = (map[place.category_id] ?? 0) + 1
    }
    return map
  }, [cityScopedPlaces])

  const categoryPlaces = useMemo(() => {
    const sortByOrderThenNewest = (a: Place, b: Place) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return b.created_at.localeCompare(a.created_at)
    }

    if (isAllCategories) {
      return [...cityScopedPlaces].sort((a, b) => {
        const catA = categoryMap.get(a.category_id)?.sort_order ?? 0
        const catB = categoryMap.get(b.category_id)?.sort_order ?? 0
        if (catA !== catB) return catA - catB
        return sortByOrderThenNewest(a, b)
      })
    }
    return cityScopedPlaces
      .filter((p) => p.category_id === activeCategory?.id)
      .sort(sortByOrderThenNewest)
  }, [cityScopedPlaces, isAllCategories, activeCategory?.id, categoryMap])

  const filterCounts = useMemo(() => {
    const visited = categoryPlaces.filter((p) => p.is_visited).length
    const incomplete = categoryPlaces.filter(
      (p) =>
        !p.area?.trim() ||
        (p.lat === null && p.lng === null && !p.maps_url?.trim()),
    ).length
    return {
      all: categoryPlaces.length,
      visited,
      unvisited: categoryPlaces.length - visited,
      incomplete,
    }
  }, [categoryPlaces])

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = categoryPlaces.filter((place) => {
      if (visitFilter === 'visited' && !place.is_visited) return false
      if (visitFilter === 'unvisited' && place.is_visited) return false
      if (
        visitFilter === 'incomplete' &&
        Boolean(place.area?.trim()) &&
        (place.lat !== null ||
          place.lng !== null ||
          Boolean(place.maps_url?.trim()))
      ) {
        return false
      }
      if (
        addedByFilter !== 'all' &&
        place.added_by.trim().toLowerCase() !== addedByFilter.toLowerCase()
      ) {
        return false
      }
      if (!q) return true

      const haystack = [
        place.name,
        place.area ?? '',
        place.added_by,
        ...place.notes,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })

    return [...matches].sort((a, b) => {
      if (sortOrder === 'az') {
        return a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
      }
      if (sortOrder === 'za') {
        return b.name.localeCompare(a.name, 'id', { sensitivity: 'base' })
      }
      const timeDiff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (timeDiff !== 0) return timeDiff
      return a.sort_order - b.sort_order
    })
  }, [categoryPlaces, query, visitFilter, addedByFilter, sortOrder])

  const groupedFilteredPlaces = useMemo(() => {
    if (!isAllCategories) return []
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredPlaces.filter((p) => p.category_id === cat.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [isAllCategories, categories, filteredPlaces])

  const handleToggleVisited = (place: Place) => {
    const nextVisited = !place.is_visited
    setLocalVisited(place.id, nextVisited)
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === place.id ? { ...p, is_visited: nextVisited } : p,
      ),
    )
    triggerHaptic(10)
    showToast(
      nextVisited
        ? `${place.name} ditandai sudah mampir!`
        : `${place.name} ditandai belum dicoba`,
    )
  }

  const handleMoveToCategory = async (
    place: Place,
    targetCategoryId: string,
  ) => {
    if (!canEdit || place.category_id === targetCategoryId) return

    const targetCategory = categories.find((c) => c.id === targetCategoryId)
    const targetPlaces = places.filter(
      (p) => p.category_id === targetCategoryId,
    )
    const nextOrder =
      targetPlaces.length > 0
        ? Math.min(...targetPlaces.map((p) => p.sort_order)) - 1
        : 0

    const nextPlaces = places.map((p) =>
      p.id === place.id
        ? { ...p, category_id: targetCategoryId, sort_order: nextOrder }
        : p,
    )

    setPlaces(nextPlaces)
    triggerHaptic(15)
    if (targetCategory) {
      showToast(
        `${place.name} dipindah ke ${targetCategory.emoji} ${targetCategory.name}`,
      )
    }

    try {
      await persistPlaceOrder(nextPlaces)
    } catch {
      setPlaces(places)
      showToast('Gagal memindahkan tempat.')
    }
  }

  const handleCreatePlace = async (input: NewPlaceInput) => {
    const created = await createPlace(input)
    setPlaces((prev) => [created, ...prev])
    if (!isAllCategories) {
      setActiveCategoryId(created.category_id)
    }
    if (created.city && cityFilter !== 'all' && created.city !== cityFilter) {
      setCityFilter(created.city)
    }
    showToast(`${created.name} berhasil ditambahkan di urutan atas!`)
  }

  const handleUpdatePlace = async (id: string, patch: UpdatePlaceInput) => {
    const updated = await updatePlace(id, patch)
    setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)))
    showToast(`Perubahan pada ${updated.name} berhasil disimpan!`)
  }

  const handleDeletePlace = async (id: string) => {
    const target = places.find((p) => p.id === id)
    await deletePlace(id)
    setPlaces((prev) => prev.filter((p) => p.id !== id))
    showToast(`${target?.name ?? 'Tempat'} berhasil dihapus!`)
  }

  const handleCreateCategory = async (input: NewCategoryInput) => {
    const created = await createCategory(input)
    setCategories((prev) => [...prev, created])
    setActiveCategoryId(created.id)
    showToast(`Kategori ${created.emoji} ${created.name} berhasil dibuat!`)
  }

  const openAddDrawer = () => {
    if (!canEdit) return
    setEditingPlace(null)
    setIsPlaceDrawerOpen(true)
  }

  const openEditDrawer = (place: Place) => {
    if (!canEdit) return
    setEditingPlace(place)
    setIsPlaceDrawerOpen(true)
  }

  const defaultDrawerCity: CityId =
    cityFilter === 'jakarta' ? 'jakarta' : 'makassar'

  return (
    <div className="flex min-h-dvh w-full flex-col bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-3xl lg:max-w-5xl">
        {/* Top Appetizing Pop-Art Header */}
        <header className="px-4 pt-4 pb-3">
          <div className="pop-card mesh-appetizing rounded-3xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mango px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-ink shadow-pop-sm">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {cityFilter === 'jakarta'
                        ? 'JAKARTA'
                        : cityFilter === 'all'
                          ? 'MKS & JKT'
                          : 'MAKASSAR LIST'}
                    </span>
                  </span>
                  <span className="rounded-full border border-ink/40 bg-paper/80 px-2 py-0.5 text-[11px] font-bold text-ink-muted">
                    {isSupabaseConfigured ? 'Realtime Sync' : 'Mode Lokal'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsIdentityModalOpen(true)}
                    title="Ganti nama atau pindah akun"
                    className={cn(
                      'pop-press inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-extrabold text-ink shadow-pop-sm',
                      canEdit
                        ? 'bg-paper hover:bg-cream-dark'
                        : 'bg-mango hover:bg-tangerine',
                    )}
                  >
                    <UserRound className="h-3 w-3" aria-hidden="true" />
                    <span>
                      {canEdit
                        ? `${friendName ? friendName.toLowerCase() : 'isi nama'} • Ganti`
                        : 'Tamu • Ganti Akun'}
                    </span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <a
                    href="https://instagram.com/weareremps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-ink bg-rose/20 px-2 py-0.5 text-[11px] font-extrabold text-ink hover:bg-rose/35"
                  >
                    <InstagramIcon className="h-3 w-3" />
                    <span>@weareremps</span>
                  </a>
                </div>

                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  Isi Perut
                </h1>
                <p className="mt-0.5 text-sm font-medium text-ink-muted">
                  Mau makan di mana hari ini? ({cityScopedPlaces.length} tempat)
                </p>
              </div>

              <CategorySticker
                colorToken={activeCategory?.color_token ?? 'red'}
                className="h-14 w-14 shrink-0 rotate-3 rounded-2xl shadow-pop"
              />
            </div>

            {/* City Switcher + Gacha SpinWheel CTA */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-ink/15 pt-3">
              <div
                role="group"
                aria-label="Pilih Kota"
                className="flex items-center gap-1 rounded-full border-2 border-ink bg-paper p-0.5 shadow-pop-sm"
              >
                {(
                  [
                    { id: 'makassar', label: '📍 Makassar' },
                    { id: 'jakarta', label: '🏙️ Jakarta' },
                    { id: 'all', label: '🌏 Semua' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCityFilter(item.id)}
                    aria-pressed={cityFilter === item.id}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-colors',
                      cityFilter === item.id
                        ? 'bg-ink text-cream'
                        : 'text-ink hover:bg-cream-dark',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsSpinWheelOpen(true)}
                className="pop-press inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mango px-3 py-1.5 text-xs font-extrabold text-ink shadow-pop-sm hover:bg-tangerine"
              >
                <Dices className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gacha!</span>
              </button>
            </div>
          </div>
        </header>

        {/* Offline Banner */}
        {isOffline && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-2xl border-2 border-ink bg-cream-dark px-3.5 py-2 text-xs font-bold text-ink">
            <WifiOff className="h-4 w-4 shrink-0 text-tomato" />
            <span>
              Kamu sedang offline — menampilkan daftar terakhir yang tersimpan.
            </span>
          </div>
        )}

        {/* Guest Mode Callout Banner */}
        {!canEdit && friendName && (
          <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-mango/45 px-3.5 py-2 text-xs font-bold text-ink">
            <span>
              Mode Tamu (lihat &amp; Gacha). Sudah diaktifkan Caca?
            </span>
            <button
              type="button"
              onClick={() => setIsIdentityModalOpen(true)}
              className="pop-press shrink-0 rounded-xl border-2 border-ink bg-paper px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-pop-sm"
            >
              Ganti Akun
            </button>
          </div>
        )}

        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Sticky Category Switcher, 3-Mode View Switcher & Search */}
        <div className="sticky top-0 z-20 bg-cream/95 px-4 pt-1 pb-3 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CategoryTabs
                categories={categories}
                activeCategoryId={activeCategoryId}
                countsByCategory={countsByCategory}
                totalCount={cityScopedPlaces.length}
                canEdit={canEdit}
                onSelectCategory={setActiveCategoryId}
                onOpenAddCategory={() => setIsCategoryModalOpen(true)}
              />
            </div>

            {/* Card / Compact List / Map Toggle */}
            <div
              role="group"
              aria-label="Mode tampilan"
              className="flex shrink-0 items-center rounded-full border-2 border-ink bg-paper p-0.5 shadow-pop-sm"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="Tampilan Kartu"
                title="Tampilan Kartu"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  viewMode === 'list'
                    ? 'bg-ink text-cream'
                    : 'text-ink hover:bg-cream-dark',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                aria-pressed={viewMode === 'compact'}
                aria-label="Tampilan List Padat"
                title="List Padat (10+ baris)"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  viewMode === 'compact'
                    ? 'bg-mango text-ink'
                    : 'text-ink hover:bg-cream-dark',
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                aria-label="Tampilan Peta"
                title="Tampilan Peta"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  viewMode === 'map'
                    ? 'bg-pandan text-ink'
                    : 'text-ink hover:bg-cream-dark',
                )}
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <SearchFilterBar
            query={query}
            onQueryChange={setQuery}
            visitFilter={visitFilter}
            onVisitFilterChange={setVisitFilter}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            addedByFilter={addedByFilter}
            addedByOptions={addedByOptions}
            onAddedByFilterChange={setAddedByFilter}
            counts={filterCounts}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-4 pb-28">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {[0, 1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="pop-card h-36 animate-pulse rounded-2xl bg-cream-dark/50"
                />
              ))}
            </div>
          ) : viewMode === 'map' ? (
            <MakassarMapView
              places={filteredPlaces}
              categories={categories}
              cityFilter={cityFilter}
              canEdit={canEdit}
              onEditPlace={openEditDrawer}
            />
          ) : filteredPlaces.length === 0 ? (
            <div className="pop-card flex flex-col items-center rounded-3xl px-6 py-10 text-center">
              <EmptyPlateDoodle className="h-24 w-24" />
              <h2 className="mt-3 font-display text-xl font-extrabold text-ink">
                {query || visitFilter !== 'all' || addedByFilter !== 'all'
                  ? 'Tidak ada tempat yang cocok'
                  : 'Kategori ini masih kosong'}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-ink-muted">
                {query || visitFilter !== 'all' || addedByFilter !== 'all'
                  ? 'Coba kata kunci lain atau reset filter.'
                  : 'Yuk tambahkan rekomendasi tempat makan atau nongki andalanmu!'}
              </p>
              {query || visitFilter !== 'all' || addedByFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setVisitFilter('all')
                    setAddedByFilter('all')
                  }}
                  className="pop-press mt-4 rounded-2xl border-2 border-ink bg-mango px-4 py-2 text-xs font-extrabold text-ink shadow-pop-sm"
                >
                  Reset Filter
                </button>
              ) : (
                canEdit && (
                  <button
                    type="button"
                    onClick={openAddDrawer}
                    className="pop-press mt-4 inline-flex items-center gap-1.5 rounded-2xl border-2 border-ink bg-tomato px-4 py-2.5 text-xs font-extrabold text-white shadow-pop-sm"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.75} />
                    <span>Tambah Tempat Pertama</span>
                  </button>
                )
              )}
            </div>
          ) : isAllCategories ? (
            <div className="space-y-6">
              {groupedFilteredPlaces.map(({ category, items }) => {
                const theme = CATEGORY_THEMES[category.color_token]
                return (
                  <section key={category.id} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border-2 border-ink px-3.5 py-1 text-sm font-extrabold shadow-pop-sm',
                          theme.pillActive,
                        )}
                      >
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs font-extrabold',
                            theme.pillBadge,
                          )}
                        >
                          {items.length}
                        </span>
                      </div>
                    </div>

                    {viewMode === 'compact' ? (
                      <div className="space-y-2">
                        {items.map((place) => (
                          <CompactPlaceRow
                            key={place.id}
                            place={place}
                            colorToken={category.color_token}
                            categoryEmoji={category.emoji}
                            canEdit={canEdit}
                            onToggleVisited={handleToggleVisited}
                            onEdit={openEditDrawer}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                        {items.map((place) => (
                          <PlaceCard
                            key={place.id}
                            place={place}
                            colorToken={category.color_token}
                            categories={categories}
                            canEdit={canEdit}
                            onToggleVisited={handleToggleVisited}
                            onEdit={openEditDrawer}
                            onMoveToCategory={handleMoveToCategory}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          ) : viewMode === 'compact' ? (
            <div className="space-y-2">
              {filteredPlaces.map((place) => (
                <CompactPlaceRow
                  key={place.id}
                  place={place}
                  colorToken={activeCategory?.color_token ?? 'red'}
                  categoryEmoji={activeCategory?.emoji ?? '🍽️'}
                  canEdit={canEdit}
                  onToggleVisited={handleToggleVisited}
                  onEdit={openEditDrawer}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  colorToken={activeCategory?.color_token ?? 'red'}
                  categories={categories}
                  canEdit={canEdit}
                  onToggleVisited={handleToggleVisited}
                  onEdit={openEditDrawer}
                  onMoveToCategory={handleMoveToCategory}
                />
              ))}
            </div>
          )}

          {/* Social Footer */}
          <footer className="mt-8 flex flex-col items-center gap-1.5 text-center">
            <a
              href="https://instagram.com/weareremps"
              target="_blank"
              rel="noopener noreferrer"
              className="pop-press inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-pop-sm hover:bg-mango/60"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              <span>@weareremps</span>
            </a>
            <p className="text-[11px] font-semibold text-ink-muted">
              Isi Perut • Makassar &amp; Jakarta Food List
            </p>
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted/60 hover:text-ink"
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              <span>Admin</span>
            </button>
          </footer>
        </main>

        {/* Thumb-Zone Floating Action Button (only for editors) */}
        {canEdit && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md justify-end px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:max-w-3xl lg:max-w-5xl">
            <button
              type="button"
              onClick={openAddDrawer}
              className="pop-press pointer-events-auto inline-flex items-center gap-2 rounded-2xl border-2 border-ink bg-tomato px-4 py-3 font-display text-sm font-extrabold text-white shadow-pop-lg"
            >
              <Plus className="h-5 w-5" strokeWidth={2.75} aria-hidden="true" />
              <span>Tambah Tempat</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile-style Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-20 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border-2 border-ink bg-ink px-4 py-2.5 text-xs font-extrabold text-cream shadow-pop"
          >
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-pandan"
              aria-hidden="true"
            />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AddPlaceDrawer
        isOpen={isPlaceDrawerOpen}
        categories={categories}
        defaultCategoryId={
          activeCategory?.id ??
          categories[0]?.id ??
          '11111111-1111-4111-8111-111111111101'
        }
        defaultCity={defaultDrawerCity}
        defaultAddedBy={friendName}
        editingPlace={editingPlace}
        onClose={() => setIsPlaceDrawerOpen(false)}
        onCreate={handleCreatePlace}
        onUpdate={handleUpdatePlace}
        onDelete={handleDeletePlace}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreate={handleCreateCategory}
      />

      <SpinWheelModal
        isOpen={isSpinWheelOpen}
        categories={categories}
        places={places}
        initialCategoryId={activeCategoryId}
        initialCity={cityFilter}
        onClose={() => setIsSpinWheelOpen(false)}
      />

      <FriendIdentityModal
        isOpen={isIdentityModalOpen}
        initialName={friendName}
        currentCanEdit={canEdit}
        canDismiss={Boolean(friendName)}
        onSave={(savedName, nextCanEdit) => {
          setFriendName(savedName)
          setCanEdit(nextCanEdit)
          setIsIdentityModalOpen(false)
          if (shouldShowWhatsNew()) {
            setIsWhatsNewOpen(true)
          } else {
            showToast(
              nextCanEdit
                ? `Halo ${savedName}! Siap isi perut?`
                : `Masuk sebagai Tamu (lihat & Gacha)`,
            )
          }
        }}
        onClose={() => setIsIdentityModalOpen(false)}
      />

      <AdminEditorsModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onPermissionsUpdated={() => {
          if (friendName) {
            void syncFriendEditPermission(friendName)
          }
        }}
      />

      <WhatsNewModal
        isOpen={isWhatsNewOpen && !isIdentityModalOpen}
        onAcknowledge={() => setIsWhatsNewOpen(false)}
      />
    </div>
  )
}

export default App
