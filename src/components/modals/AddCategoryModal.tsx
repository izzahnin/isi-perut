import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { cn } from '../../lib/utils'
import type { CategoryColorToken, NewCategoryInput } from '../../types/place'

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (input: NewCategoryInput) => Promise<void>
}

const EMOJI_PRESETS = ['🍽️', '🍜', '☕', '🍰', '🔥', '🌙', '🥗', '🍢']

const COLOR_OPTIONS: {
  token: CategoryColorToken
  label: string
  swatchClass: string
}[] = [
  { token: 'red', label: 'Chili', swatchClass: 'bg-tomato text-white' },
  { token: 'orange', label: 'Tangerine', swatchClass: 'bg-tangerine text-ink' },
  { token: 'green', label: 'Pandan', swatchClass: 'bg-pandan text-ink' },
  { token: 'purple', label: 'Berry', swatchClass: 'bg-berry text-white' },
]

export function AddCategoryModal({
  isOpen,
  onClose,
  onCreate,
}: AddCategoryModalProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [colorToken, setColorToken] = useState<CategoryColorToken>('green')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setEmoji('🍽️')
    setColorToken('green')
    setErrorMsg('')
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi.')
      return
    }
    setIsSaving(true)
    setErrorMsg('')
    try {
      await onCreate({ name: name.trim(), emoji, color_token: colorToken })
      onClose()
    } catch {
      setErrorMsg('Gagal membuat kategori baru.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-category-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="modal-category-title"
                className="font-display text-xl font-extrabold text-ink"
              >
                Buat Kategori Baru
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal kategori"
                className="pop-press flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                >
                  Nama Kategori *
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dessert, Late Night, Cemilan"
                  className="w-full rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-mango"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                  Pilih Ikon
                </span>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEmoji(preset)}
                      className={cn(
                        'pop-press flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink text-lg',
                        emoji === preset
                          ? 'bg-mango shadow-pop-sm'
                          : 'bg-paper hover:bg-cream-dark',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                  Warna Tema
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.token}
                      type="button"
                      onClick={() => setColorToken(option.token)}
                      className={cn(
                        'pop-press flex items-center justify-between rounded-xl border-2 border-ink px-3 py-2 text-xs font-extrabold',
                        option.swatchClass,
                        colorToken === option.token
                          ? 'ring-2 ring-ink ring-offset-2 ring-offset-cream shadow-pop-sm'
                          : 'opacity-80 hover:opacity-100',
                      )}
                    >
                      <span>{option.label}</span>
                      {colorToken === option.token && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="rounded-xl border-2 border-ink bg-tomato px-3 py-2 text-xs font-bold text-white">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="pop-press w-full rounded-2xl border-2 border-ink bg-mango px-4 py-3 font-display text-sm font-extrabold text-ink shadow-pop disabled:opacity-60"
              >
                {isSaving ? 'Membuat...' : 'Tambah Kategori'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
