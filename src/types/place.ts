export type CategoryColorToken = 'red' | 'orange' | 'green' | 'purple'

export type Category = {
  id: string
  name: string
  slug: string
  emoji: string
  color_token: CategoryColorToken
  sort_order: number
  created_at: string
}

export type CityId = 'makassar' | 'jakarta'

export type Place = {
  id: string
  category_id: string
  name: string
  notes: string[]
  area: string | null
  city?: CityId
  lat: number | null
  lng: number | null
  maps_url: string | null
  added_by: string
  is_visited: boolean
  sort_order: number
  created_at: string
}

export interface NewCategoryInput {
  name: string
  emoji?: string
  color_token?: CategoryColorToken
}

export interface NewPlaceInput {
  category_id: string
  name: string
  notes?: string[]
  area?: string | null
  city?: CityId
  lat?: number | null
  lng?: number | null
  maps_url?: string | null
  added_by?: string
  is_visited?: boolean
}

export interface UpdatePlaceInput {
  category_id?: string
  name?: string
  notes?: string[]
  area?: string | null
  city?: CityId
  lat?: number | null
  lng?: number | null
  maps_url?: string | null
  added_by?: string
  is_visited?: boolean
  sort_order?: number
}

export interface SeedData {
  categories: Category[]
  places: Place[]
}
