import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, UserRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { registerOrCheckFriendName } from '../../lib/supabase'

const FRIEND_NAME_KEY = 'isi-perut:friend-name:v1'

export function getSavedFriendName(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(FRIEND_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function saveFriendName(name: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FRIEND_NAME_KEY, name.trim())
  } catch {
    // Ignore storage errors
  }
}

interface FriendIdentityModalProps {
  isOpen: boolean
  initialName: string
  canDismiss: boolean
  onSave: (name: string) => void
  onClose: () => void
}

export function FriendIdentityModal({
  isOpen,
  initialName,
  canDismiss,
  onSave,
  onClose,
}: FriendIdentityModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [existingConfirmName, setExistingConfirmName] = useState<string | null>(
    null,
  )

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
      if (result === 'exists' && trimmed.toLowerCase() !== initialName.toLowerCase()) {
        setExistingConfirmName(trimmed)
        return
      }
      saveFriendName(trimmed)
      onSave(trimmed)
    } finally {
      setIsChecking(false)
    }
  }

  const handleConfirmExisting = () => {
    if (!existingConfirmName) return
    saveFriendName(existingConfirmName)
    onSave(existingConfirmName)
    setExistingConfirmName(null)
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
              (tanpa perlu buat akun). Nama ini dipakai untuk tag{' '}
              <span className="font-bold text-ink">by [Namamu]</span>, sedangkan
              status <em>Sudah Mampir</em> tersimpan pribadi di perangkatmu.
            </p>

            {existingConfirmName ? (
              <div className="mt-4 space-y-3 rounded-2xl border-2 border-ink bg-mango/40 p-3.5">
                <p className="text-xs font-bold text-ink">
                  Nama <span className="font-extrabold">{existingConfirmName}</span>{' '}
                  sudah terdaftar di grup. Apakah ini kamu?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExistingConfirmName(null)}
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
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
