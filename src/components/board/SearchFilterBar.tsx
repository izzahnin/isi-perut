import { Search, UserRound, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type VisitFilter = 'all' | 'unvisited' | 'visited' | 'incomplete'

interface SearchFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  visitFilter: VisitFilter
  onVisitFilterChange: (filter: VisitFilter) => void
  addedByFilter: string
  addedByOptions: string[]
  onAddedByFilterChange: (name: string) => void
  counts: {
    all: number
    unvisited: number
    visited: number
    incomplete: number
  }
}

const FILTER_OPTIONS: { id: VisitFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'unvisited', label: 'Belum Dicoba' },
  { id: 'visited', label: 'Sudah Dicoba' },
  { id: 'incomplete', label: 'Info Kurang' },
]

export function SearchFilterBar({
  query,
  onQueryChange,
  visitFilter,
  onVisitFilterChange,
  addedByFilter,
  addedByOptions,
  onAddedByFilterChange,
  counts,
}: SearchFilterBarProps) {
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2 shadow-pop-sm focus-within:ring-2 focus-within:ring-mango">
          <Search
            className="h-4 w-4 shrink-0 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari coto, kopi, area, atau nama..."
            className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-muted focus:outline-none"
            aria-label="Cari tempat makan atau nongki"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Hapus pencarian"
              className="rounded-full p-1 text-ink-muted hover:bg-cream-dark hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter by creator (added_by) */}
        {addedByOptions.length > 0 && (
          <div className="relative shrink-0">
            <UserRound
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink"
              aria-hidden="true"
            />
            <select
              aria-label="Filter berdasarkan pembuat"
              value={addedByFilter}
              onChange={(e) => onAddedByFilterChange(e.target.value)}
              className={cn(
                'pop-press h-10 appearance-none rounded-2xl border-2 border-ink py-1.5 pl-7 pr-6 text-xs font-extrabold shadow-pop-sm focus:outline-none',
                addedByFilter === 'all'
                  ? 'bg-paper text-ink'
                  : 'bg-mango text-ink',
              )}
            >
              <option value="all">Semua Teman</option>
              {addedByOptions.map((creator) => (
                <option key={creator} value={creator}>
                  by {creator}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div
        role="group"
        aria-label="Filter status kunjungan"
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = visitFilter === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onVisitFilterChange(option.id)}
              aria-pressed={isActive}
              className={cn(
                'pop-press inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-ink px-2.5 py-1 text-xs font-bold',
                isActive
                  ? 'bg-ink text-cream shadow-pop-sm'
                  : option.id === 'incomplete' && counts.incomplete > 0
                    ? 'bg-mango/50 text-ink hover:bg-mango'
                    : 'bg-paper text-ink hover:bg-cream-dark',
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.2 text-[11px] font-extrabold',
                  isActive ? 'bg-cream/20 text-cream' : 'bg-cream-dark text-ink',
                )}
              >
                {counts[option.id]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
