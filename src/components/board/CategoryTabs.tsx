import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { CATEGORY_THEMES } from '../../lib/category-theme'
import { getCategoryDropId } from '../../lib/dnd-config'
import { cn } from '../../lib/utils'
import type { Category } from '../../types/place'

export const ALL_CATEGORIES_ID = '__all__'

interface CategoryTabsProps {
  categories: Category[]
  activeCategoryId: string
  countsByCategory: Record<string, number>
  totalCount: number
  isDraggingPlace?: boolean
  onSelectCategory: (categoryId: string) => void
  onOpenAddCategory: () => void
}

interface DroppableCategoryPillProps {
  category: Category
  isActive: boolean
  count: number
  isDraggingPlace: boolean
  onSelect: () => void
}

function DroppableCategoryPill({
  category,
  isActive,
  count,
  isDraggingPlace,
  onSelect,
}: DroppableCategoryPillProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: getCategoryDropId(category.id),
    data: { type: 'category', categoryId: category.id },
  })

  const theme = CATEGORY_THEMES[category.color_token]

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      whileTap={{ scale: 0.94 }}
      animate={isOver ? { scale: 1.07 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={onSelect}
      aria-pressed={isActive}
      className={cn(
        'pop-press inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-2 text-sm font-bold transition-colors',
        isOver
          ? 'bg-mango text-ink ring-2 ring-ink ring-offset-2 ring-offset-cream shadow-pop'
          : isActive
            ? cn(theme.pillActive, 'shadow-pop')
            : isDraggingPlace
              ? 'border-dashed bg-paper text-ink shadow-pop-sm'
              : 'bg-paper text-ink shadow-pop-sm hover:bg-cream-dark',
      )}
    >
      <span aria-hidden="true">{category.emoji}</span>
      <span>{category.name}</span>
      <span
        className={cn(
          'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-extrabold',
          isActive && !isOver ? theme.pillBadge : 'bg-cream-dark text-ink',
        )}
      >
        {count}
      </span>
    </motion.button>
  )
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  countsByCategory,
  totalCount,
  isDraggingPlace = false,
  onSelectCategory,
  onOpenAddCategory,
}: CategoryTabsProps) {
  const isAllActive = activeCategoryId === ALL_CATEGORIES_ID

  return (
    <nav
      aria-label="Kategori tempat"
      className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => onSelectCategory(ALL_CATEGORIES_ID)}
        aria-pressed={isAllActive}
        className={cn(
          'pop-press inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-2 text-sm font-bold transition-colors',
          isAllActive
            ? 'bg-ink text-cream shadow-pop'
            : 'bg-paper text-ink shadow-pop-sm hover:bg-cream-dark',
        )}
      >
        <span aria-hidden="true">🍽️</span>
        <span>Semua</span>
        <span
          className={cn(
            'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-extrabold',
            isAllActive ? 'bg-cream/20 text-cream' : 'bg-cream-dark text-ink',
          )}
        >
          {totalCount}
        </span>
      </motion.button>

      {categories.map((category) => (
        <DroppableCategoryPill
          key={category.id}
          category={category}
          isActive={category.id === activeCategoryId}
          count={countsByCategory[category.id] ?? 0}
          isDraggingPlace={isDraggingPlace}
          onSelect={() => onSelectCategory(category.id)}
        />
      ))}

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={onOpenAddCategory}
        className="pop-press inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-dashed border-ink bg-cream-dark px-3 py-2 text-xs font-extrabold text-ink hover:bg-mango/50"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden="true" />
        <span>Kategori</span>
      </motion.button>
    </nav>
  )
}
