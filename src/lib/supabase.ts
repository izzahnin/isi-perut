import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import seedData from '../data/seed-makassar.json'
import type { Database } from '../types/database'
import type {
  Category,
  NewCategoryInput,
  NewPlaceInput,
  Place,
  SeedData,
  UpdatePlaceInput,
} from '../types/place'

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  ''
).trim()
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  ''
).trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

const STORAGE_CATEGORIES_KEY = 'isi-perut:categories:v10'
const STORAGE_PLACES_KEY = 'isi-perut:places:v10'
const STORAGE_VISITED_KEY = 'isi-perut:visited:v1'

export async function registerOrCheckFriendName(
  rawName: string,
): Promise<'created' | 'exists' | 'local'> {
  const cleanName = rawName.trim()
  if (!supabase) return 'local'

  const { data: existing } = await supabase
    .from('friends')
    .select('name')
    .ilike('name', cleanName)
    .maybeSingle()

  if (existing) {
    return 'exists'
  }

  const { error } = await supabase.from('friends').insert({ name: cleanName })
  if (error) {
    // Unique constraint conflict means it was just registered
    return 'exists'
  }
  return 'created'
}

export function getLocalVisitedMap(): Record<string, boolean> {
  return readLocal<Record<string, boolean>>(STORAGE_VISITED_KEY, {})
}

export function setLocalVisited(placeId: string, isVisited: boolean): void {
  const current = getLocalVisitedMap()
  writeLocal(STORAGE_VISITED_KEY, {
    ...current,
    [placeId]: isVisited,
  })
}

const typedSeed = seedData as SeedData

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota errors
  }
}

function ensureLocalSeeded(): { categories: Category[]; places: Place[] } {
  const existingCategories = readLocal<Category[] | null>(
    STORAGE_CATEGORIES_KEY,
    null,
  )
  const existingPlaces = readLocal<Place[] | null>(STORAGE_PLACES_KEY, null)

  if (existingCategories && existingPlaces) {
    return { categories: existingCategories, places: existingPlaces }
  }

  const categories = [...typedSeed.categories]
  const places = [...typedSeed.places]
  writeLocal(STORAGE_CATEGORIES_KEY, categories)
  writeLocal(STORAGE_PLACES_KEY, places)
  return { categories, places }
}

function createSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
  return base || `kategori-${Date.now()}`
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function fetchCategories(): Promise<Category[]> {
  if (!supabase) {
    const { categories } = ensureLocalSeeded()
    return [...categories].sort((a, b) => a.sort_order - b.sort_order)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    const cached = readLocal<Category[]>(
      STORAGE_CATEGORIES_KEY,
      typedSeed.categories,
    )
    return cached
  }

  // Auto-seed default categories if Supabase table is empty
  if (data.length === 0) {
    const { data: seeded, error: seedError } = await supabase
      .from('categories')
      .upsert(typedSeed.categories, { onConflict: 'id' })
      .select()
    if (!seedError && seeded) {
      writeLocal(STORAGE_CATEGORIES_KEY, seeded)
      return [...seeded].sort((a, b) => a.sort_order - b.sort_order)
    }
  }

  writeLocal(STORAGE_CATEGORIES_KEY, data)
  return data
}

export async function fetchPlaces(): Promise<Place[]> {
  const visitedMap = getLocalVisitedMap()
  const applyLocalVisited = (items: Place[]): Place[] =>
    items.map((item) => ({
      ...item,
      is_visited: visitedMap[item.id] ?? item.is_visited,
    }))

  if (!supabase) {
    const { places } = ensureLocalSeeded()
    return applyLocalVisited(
      [...places].sort((a, b) => a.sort_order - b.sort_order),
    )
  }

  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    const cached = readLocal<Place[]>(STORAGE_PLACES_KEY, typedSeed.places)
    return applyLocalVisited(cached)
  }

  // Auto-seed 118 Makassar places if Supabase table is empty
  if (data.length === 0) {
    const { data: seeded, error: seedError } = await supabase
      .from('places')
      .upsert(typedSeed.places, { onConflict: 'id' })
      .select()
    if (!seedError && seeded) {
      writeLocal(STORAGE_PLACES_KEY, seeded)
      return applyLocalVisited(
        [...seeded].sort((a, b) => a.sort_order - b.sort_order),
      )
    }
  }

  writeLocal(STORAGE_PLACES_KEY, data)
  return applyLocalVisited(data)
}

export async function createCategory(
  input: NewCategoryInput,
): Promise<Category> {
  const current = await fetchCategories()
  const nextOrder =
    current.length > 0
      ? Math.max(...current.map((c) => c.sort_order)) + 1
      : 0

  const newCategory: Category = {
    id: createId(),
    name: input.name.trim(),
    slug: createSlug(input.name),
    emoji: input.emoji?.trim() || '🍽️',
    color_token: input.color_token ?? 'green',
    sort_order: nextOrder,
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    const next = [...current, newCategory]
    writeLocal(STORAGE_CATEGORIES_KEY, next)
    return newCategory
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: newCategory.name,
      slug: `${newCategory.slug}-${Date.now().toString(36).slice(-4)}`,
      emoji: newCategory.emoji,
      color_token: newCategory.color_token,
      sort_order: newCategory.sort_order,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createPlace(input: NewPlaceInput): Promise<Place> {
  const current = await fetchPlaces()
  const categoryPlaces = current.filter(
    (p) => p.category_id === input.category_id,
  )
  const nextOrder =
    categoryPlaces.length > 0
      ? Math.max(...categoryPlaces.map((p) => p.sort_order)) + 1
      : 0

  const newPlace: Place = {
    id: createId(),
    category_id: input.category_id,
    name: input.name.trim(),
    notes: input.notes ?? [],
    area: input.area?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    maps_url: input.maps_url ?? null,
    added_by: input.added_by?.trim() || 'Teman',
    is_visited: input.is_visited ?? false,
    sort_order: nextOrder,
    created_at: new Date().toISOString(),
  }

  if (!supabase) {
    const next = [...current, newPlace]
    writeLocal(STORAGE_PLACES_KEY, next)
    return newPlace
  }

  const { data, error } = await supabase
    .from('places')
    .insert({
      category_id: newPlace.category_id,
      name: newPlace.name,
      notes: newPlace.notes,
      area: newPlace.area,
      lat: newPlace.lat,
      lng: newPlace.lng,
      maps_url: newPlace.maps_url,
      added_by: newPlace.added_by,
      is_visited: newPlace.is_visited,
      sort_order: newPlace.sort_order,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlace(
  id: string,
  patch: UpdatePlaceInput,
): Promise<Place> {
  if (!supabase) {
    const { places } = ensureLocalSeeded()
    const index = places.findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error(`Place not found: ${id}`)
    }
    const updated: Place = { ...places[index], ...patch }
    const next = [...places]
    next[index] = updated
    writeLocal(STORAGE_PLACES_KEY, next)
    return updated
  }

  const { data, error } = await supabase
    .from('places')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlace(id: string): Promise<void> {
  if (!supabase) {
    const { places } = ensureLocalSeeded()
    writeLocal(
      STORAGE_PLACES_KEY,
      places.filter((p) => p.id !== id),
    )
    return
  }

  const { error } = await supabase.from('places').delete().eq('id', id)
  if (error) throw error
}

export async function persistPlaceOrder(places: Place[]): Promise<void> {
  writeLocal(STORAGE_PLACES_KEY, places)
  if (!supabase) {
    return
  }

  await Promise.all(
    places.map((place) =>
      supabase
        .from('places')
        .update({
          category_id: place.category_id,
          sort_order: place.sort_order,
        })
        .eq('id', place.id),
    ),
  )
}

export interface BoardRealtimeCallbacks {
  onPlacesChanged: () => void
  onCategoriesChanged: () => void
  onRemotePlaceEvent?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', placeName?: string) => void
}

/**
 * Subscribes to Supabase Realtime changes on `places` and `categories`.
 * Returns an unsubscribe cleanup function (no-op in local mode).
 */
export function subscribeToBoardChanges(
  callbacks: BoardRealtimeCallbacks,
): () => void {
  if (!supabase) return () => {}

  const channel = supabase
    .channel('isi-perut-board-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'places' },
      (payload) => {
        callbacks.onPlacesChanged()
        const record = (payload.new || payload.old) as Partial<Place> | undefined
        if (
          payload.eventType === 'INSERT' ||
          payload.eventType === 'UPDATE' ||
          payload.eventType === 'DELETE'
        ) {
          callbacks.onRemotePlaceEvent?.(payload.eventType, record?.name)
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      () => {
        callbacks.onCategoriesChanged()
      },
    )
    .subscribe()

  return () => {
    void supabase?.removeChannel(channel)
  }
}
