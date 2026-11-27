import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Sparkles, UserRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { registerOrCheckFriendName } from '../../lib/supabase'

const FRIEND_NAME_KEY = 'isi-perut:friend-name:v1'
const FRIEND_CAN_EDIT_KEY = 'isi-perut:friend-can-edit:v1'

export function getSavedFriendName(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(FRIEND_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function getSavedCanEdit(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(FRIEND_CAN_EDIT_KEY)
    return raw === null ? true : raw === '1'
  } catch {
    return true
  }
}

export function saveFriendSession(name: string, canEdit: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FRIEND_NAME_KEY, name.trim())
    window.localStorage.setItem(FRIEND_CAN_EDIT_KEY, canEdit ? '1' : '0')
  } catch {
    // Ignore storage errors
  }
}

interface FriendIdentityModalProps {
  isOpen: boolean
  initialName: string
  canDismiss: boolean
  onSave: (name: string, canEdit: boolean) => void
  onClose: () => void
  onOpenAdmin?: () => void
}

export function FriendIdentityModal({
  isOpen,
  initialName,
  canDismiss,
  onSave,
  onClose,
  onOpenAdmin,
}: FriendIdentityModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [existingConfirm, setExistingConfirm] = useState<{
    name: string
    canEdit: boolean
  } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Tulis nama panggilanmu dulu ya!')
      return
    }

    setIsChecking(true)
    setError('')
    try {
      const result = await registerOrCheckFriendName(trimmed)
      if (
        result.status === 'exists' &&
        result.canonicalName.toLowerCase() !== initialName.toLowerCase()
      ) {
        setExistingConfirm({
          name: result.canonicalName,
          canEdit: result.canEdit,
        })
        return
      }
      saveFriendSession(result.canonicalName, result.canEdit)
      onSave(result.canonicalName, result.canEdit)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConfirmExisting = () => {
    if (!existingConfirm) return
    saveFriendSession(existingConfirm.name, existingConfirm.canEdit)
    onSave(existingConfirm.name, existingConfirm.canEdit)
    setExistingConfirm(null)
  }

  const handleEnterAsGuest = () => {
    saveFriendSession('Tamu', false)
    onSave('Tamu', false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-identity-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={canDismiss ? onClose : undefined}
            className="fixed inset-0 bg-ink/55 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mango px-2.5 py-0.5 text-xs font-extrabold text-ink shadow-pop-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>KENALAN DULU</span>
              </div>
              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <h2
              id="friend-identity-title"
              className="mt-3 font-display text-2xl font-extrabold text-ink"
            >
              Siapa namamu?
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Cukup pakai <span className="font-bold text-ink">1 nama unik</span>{' '}
              (tanpa buat akun). Status <em>Sudah Mampir</em> tersimpan pribadi di
              perangkatmu.
            </p>

            {existingConfirm ? (
              <div className="mt-4 space-y-3 rounded-2xl border-2 border-ink bg-mango/40 p-3.5">
                <p className="text-xs font-bold text-ink">
                  Nama{' '}
                  <span className="font-extrabold">{existingConfirm.name}</span>{' '}
                  sudah terdaftar di grup. Apakah ini kamu?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExistingConfirm(null)}
                    className="pop-press flex-1 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-xs font-extrabold text-ink shadow-pop-sm"
                  >
                    Ganti Nama
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExisting}
                    className="pop-press flex-1 rounded-xl border-2 border-ink bg-pandan px-3 py-2 text-xs font-extrabold text-ink shadow-pop-sm"
                  >
                    Ya, Ini Saya
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-mango">
                  <UserRound className="h-4 w-4 shrink-0 text-ink-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError('')
                    }}
                    placeholder="Contoh: Caca, Pije, Raka"
                    autoFocus
                    className="w-full bg-transparent text-sm font-bold text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border-2 border-ink bg-tomato px-3 py-1.5 text-xs font-bold text-white">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isChecking}
                  className="pop-press w-full rounded-2xl border-2 border-ink bg-pandan px-4 py-3 font-display text-sm font-extrabold text-ink shadow-pop disabled:opacity-60"
                >
                  {isChecking ? 'Mengecek nama...' : 'Gas Masuk!'}
                </button>

                <button
                  type="button"
                  onClick={handleEnterAsGuest}
                  className="pop-press inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/60 bg-paper px-4 py-2.5 text-xs font-extrabold text-ink-muted hover:bg-cream-dark hover:text-ink"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Masuk Sebagai Tamu (Lihat &amp; Gacha Saja)</span>
                </button>

                {onOpenAdmin && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (canDismiss) onClose()
                        onOpenAdmin()
                      }}
                      className="text-[11px] font-bold text-ink-muted underline decoration-ink/30 underline-offset-2 hover:text-ink"
                    >
                      🔐 Atur Daftar Nama Teman (Khusus Admin)
                    </button>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
