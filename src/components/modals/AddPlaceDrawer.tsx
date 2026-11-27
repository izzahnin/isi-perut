import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, MapPin, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { parseMapsInput } from '../../lib/maps-parser'
import { cn } from '../../lib/utils'
import type { Category, NewPlaceInput, Place, UpdatePlaceInput } from '../../types/place'

interface AddPlaceDrawerProps {
  isOpen: boolean
  categories: Category[]
  defaultCategoryId: string
  defaultAddedBy?: string
  editingPlace: Place | null
  onClose: () => void
  onCreate: (input: NewPlaceInput) => Promise<void>
  onUpdate: (id: string, patch: UpdatePlaceInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AddPlaceDrawer({
  isOpen,
  categories,
  defaultCategoryId,
  defaultAddedBy = '',
  editingPlace,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: AddPlaceDrawerProps) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [notesRaw, setNotesRaw] = useState('')
  const [mapsRaw, setMapsRaw] = useState('')
  const [addedBy, setAddedBy] = useState('')
  const [isVisited, setIsVisited] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editingPlace) {
      setCategoryId(editingPlace.category_id)
      setName(editingPlace.name)
      setArea(editingPlace.area ?? '')
      setNotesRaw(editingPlace.notes.join(', '))
      setMapsRaw(
        editingPlace.maps_url ??
          (editingPlace.lat !== null && editingPlace.lng !== null
            ? `${editingPlace.lat}, ${editingPlace.lng}`
            : ''),
      )
      setAddedBy(editingPlace.added_by)
      setIsVisited(editingPlace.is_visited)
    } else {
      setCategoryId(defaultCategoryId)
      setName('')
      setArea('')
      setNotesRaw('')
      setMapsRaw('')
      setAddedBy(defaultAddedBy)
      setIsVisited(false)
    }
    setConfirmDelete(false)
    setErrorMsg('')
  }, [isOpen, editingPlace, defaultCategoryId, defaultAddedBy])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const parsedMaps = useMemo(() => parseMapsInput(mapsRaw), [mapsRaw])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama tempatnya wajib diisi dulu ya!')
      return
    }

    setIsSaving(true)
    setErrorMsg('')

    const notes = notesRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    try {
      if (editingPlace) {
        await onUpdate(editingPlace.id, {
          category_id: categoryId,
          name: name.trim(),
          area: area.trim() || null,
          notes,
          lat: parsedMaps.lat,
          lng: parsedMaps.lng,
          maps_url: parsedMaps.mapsUrl,
          added_by: addedBy.trim() || 'Teman',
          is_visited: isVisited,
        })
      } else {
        await onCreate({
          category_id: categoryId,
          name: name.trim(),
          area: area.trim() || null,
          notes,
          lat: parsedMaps.lat,
          lng: parsedMaps.lng,
          maps_url: parsedMaps.mapsUrl,
          added_by: addedBy.trim() || 'Teman',
          is_visited: isVisited,
        })
      }
      onClose()
    } catch {
      setErrorMsg('Gagal menyimpan tempat. Coba lagi sebentar.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPlace) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsSaving(true)
    try {
      await onDelete(editingPlace.id)
      onClose()
    } catch {
      setErrorMsg('Gagal menghapus tempat.')
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
          aria-labelledby="drawer-place-title"
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
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            {/* Mobile grab handle */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20 md:hidden" />

            <div className="flex items-center justify-between gap-3">
              <h2
                id="drawer-place-title"
                className="font-display text-xl font-extrabold text-ink"
              >
                {editingPlace ? 'Edit Tempat' : 'Tambah Tempat Baru'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup form"
                className="pop-press flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-muted">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const selected = cat.id === categoryId
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          'pop-press inline-flex items-center gap-1 rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold',
                          selected
                            ? 'bg-mango text-ink shadow-pop-sm'
                            : 'bg-paper text-ink hover:bg-cream-dark',
                        )}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="place-name"
                  className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                >
                  Nama Tempat *
                </label>
                <input
                  id="place-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Coto Paraikatte"
                  className="w-full rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-mango"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="place-area"
                    className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                  >
                    Area / Jalan
                  </label>
                  <input
                    id="place-area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="boulevard, popsa, cendrawasih"
                    className="w-full rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-mango"
                  />
                </div>

                <div>
                  <label
                    htmlFor="place-added-by"
                    className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                  >
                    Ditambah Oleh
                  </label>
                  <input
                    id="place-added-by"
                    type="text"
                    value={addedBy}
                    onChange={(e) => setAddedBy(e.target.value)}
                    placeholder="Namamu (opsional)"
                    className="w-full rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-mango"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="place-notes"
                  className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                >
                  Catatan / Tag (pisahkan koma)
                </label>
                <input
                  id="place-notes"
                  type="text"
                  value={notesRaw}
                  onChange={(e) => setNotesRaw(e.target.value)}
                  placeholder="chill, soon, formal dinner"
                  className="w-full rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-mango"
                />
              </div>

              <div>
                <label
                  htmlFor="place-maps"
                  className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink-muted"
                >
                  Link Google Maps atau Koordinat
                </label>
                <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-mango">
                  <MapPin className="h-4 w-4 shrink-0 text-pandan" />
                  <input
                    id="place-maps"
                    type="text"
                    value={mapsRaw}
                    onChange={(e) => setMapsRaw(e.target.value)}
                    placeholder="Tempel link Maps atau -5.1342, 119.4067"
                    className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                </div>
                {parsedMaps.lat !== null && parsedMaps.lng !== null ? (
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-pandan/25 px-2 py-0.5 text-xs font-bold text-ink">
                    <CheckCircle2 className="h-3.5 w-3.5 text-ink" />
                    <span>
                      Koordinat terbaca: {parsedMaps.lat.toFixed(4)},{' '}
                      {parsedMaps.lng.toFixed(4)}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] font-semibold text-ink-muted">
                    Info Maps masih kosong — tempel link Google Maps agar pin muncul di Peta Makassar.
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5">
                <span className="text-sm font-bold text-ink">
                  Sudah pernah mampir ke sini?
                </span>
                <input
                  type="checkbox"
                  checked={isVisited}
                  onChange={(e) => setIsVisited(e.target.checked)}
                  className="h-5 w-5 accent-pandan"
                />
              </label>

              {errorMsg && (
                <p className="rounded-xl border-2 border-ink bg-tomato px-3 py-2 text-xs font-bold text-white">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                {editingPlace && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDelete}
                    className={cn(
                      'pop-press inline-flex items-center gap-1.5 rounded-2xl border-2 border-ink px-3.5 py-3 text-sm font-extrabold shadow-pop-sm',
                      confirmDelete
                        ? 'bg-tomato text-white'
                        : 'bg-paper text-ink hover:bg-cream-dark',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{confirmDelete ? 'Yakin Hapus?' : 'Hapus'}</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="pop-press flex-1 rounded-2xl border-2 border-ink bg-pandan px-4 py-3 font-display text-sm font-extrabold text-ink shadow-pop disabled:opacity-60"
                >
                  {isSaving
                    ? 'Menyimpan...'
                    : editingPlace
                      ? 'Simpan Perubahan'
                      : 'Simpan Tempat'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
