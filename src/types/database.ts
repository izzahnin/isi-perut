import type { Category, CategoryColorToken, Place } from './place'

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: {
          id?: string
          name: string
          slug: string
          emoji?: string
          color_token?: CategoryColorToken
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          emoji?: string
          color_token?: CategoryColorToken
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      places: {
        Row: Place
        Insert: {
          id?: string
          category_id: string
          name: string
          notes?: string[]
          area?: string | null
          city?: 'makassar' | 'jakarta'
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          added_by?: string
          is_visited?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          notes?: string[]
          area?: string | null
          city?: 'makassar' | 'jakarta'
          lat?: number | null
          lng?: number | null
          maps_url?: string | null
          added_by?: string
          is_visited?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'places_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      friends: {
        Row: {
          name: string
          created_at: string
        }
        Insert: {
          name: string
          created_at?: string
        }
        Update: {
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
