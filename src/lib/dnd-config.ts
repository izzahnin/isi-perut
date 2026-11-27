import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export const CATEGORY_DROP_PREFIX = 'category-drop-'

export function getCategoryDropId(categoryId: string): string {
  return `${CATEGORY_DROP_PREFIX}${categoryId}`
}

export function parseCategoryDropId(droppableId: string): string | null {
  if (!droppableId.startsWith(CATEGORY_DROP_PREFIX)) return null
  return droppableId.slice(CATEGORY_DROP_PREFIX.length)
}

/**
 * Touch-safe DnD sensors:
 * - TouchSensor requires a 200ms hold with 8px tolerance so vertical scrolling stays smooth.
 * - PointerSensor requires 6px movement so normal taps/clicks are unaffected.
 */
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
}

export function triggerHaptic(durationMs = 15): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(durationMs)
  }
}
