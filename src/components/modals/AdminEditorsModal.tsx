import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  getLocalFriends,
  isSupabaseConfigured,
  saveLocalFriends,
  type LocalFriendRecord,
} from '../../lib/supabase'
import { cn } from '../../lib/utils'

interface AdminEditorsModalProps {
  isOpen: boolean
  onClose: () => void
  onPermissionsUpdated?: () => void
}

export function AdminEditorsModal({
  isOpen,
  onClose,
  onPermissionsUpdated,
}: AdminEditorsModalProps) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [friends, setFriends] = useState<LocalFriendRecord[]>([])
  const [newName, setNewName] = useState('')
  const [busyName, setBusyName] = useState<string | null>(null)

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleLock = () => {
    setIsUnlocked(false)
    setPin('')
    setFriends([])
    setError('')
  }

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault()
    const cleanPin = pin.trim()
    if (!cleanPin) {
      setError('Masukkan PIN Admin dulu.')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      if (!isSupabaseConfigured) {
        if (cleanPin !== '1234') {
          setError('Mode Lokal: gunakan PIN demo 1234.')
          return
        }
        setFriends(getLocalFriends())
        setIsUnlocked(true)
        return
      }

      const res = await fetch('/api/admin-editors', {
        method: 'GET',
        headers: { 'x-admin-pin': cleanPin },
      })
      const json = (await res.json()) as {
        friends?: LocalFriendRecord[]
        error?: string
      }
      if (!res.ok) {
        setError(json.error || 'Gagal membuka panel admin.')
        return
      }
      setFriends(json.friends ?? [])
      setIsUnlocked(true)
    } catch {
      setError('Gagal terhubung ke server admin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async (e: FormEvent) => {
    e.preventDefault()
    const cleanName = newName.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!cleanName) return

    setIsLoading(true)
    setError('')
    try {
      if (!isSupabaseConfigured) {
        const current = getLocalFriends()
        const idx = current.findIndex(
          (f) => f.name.toLowerCase() === cleanName.toLowerCase(),
        )
        const next =
          idx >= 0
            ? current.map((f, i) => (i === idx ? { ...f, can_edit: true } : f))
            : [
                ...current,
                {
                  name: cleanName,
                  can_edit: true,
                  created_at: new Date().toISOString(),
                },
              ]
        saveLocalFriends(next)
        setFriends(next)
        setNewName('')
        onPermissionsUpdated?.()
        return
      }

      const res = await fetch('/api/admin-editors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin.trim(),
        },
        body: JSON.stringify({ name: cleanName, can_edit: true }),
      })
      const json = (await res.json()) as {
        friend?: LocalFriendRecord
        error?: string
      }
      if (!res.ok || !json.friend) {
        setError(json.error || 'Gagal menambah nama teman.')
        return
      }
      const saved = json.friend
      setFriends((prev) => {
        const exists = prev.some(
          (f) => f.name.toLowerCase() === saved.name.toLowerCase(),
        )
        return exists
          ? prev.map((f) =>
              f.name.toLowerCase() === saved.name.toLowerCase() ? saved : f,
            )
          : [...prev, saved]
      })
      setNewName('')
      onPermissionsUpdated?.()
    } catch {
      setError('Gagal menambah nama teman.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCanEdit = async (target: LocalFriendRecord) => {
    const nextCanEdit = !target.can_edit
    setBusyName(target.name)
    setError('')
    try {
      if (!isSupabaseConfigured) {
        const next = getLocalFriends().map((f) =>
          f.name === target.name ? { ...f, can_edit: nextCanEdit } : f,
        )
        saveLocalFriends(next)
        setFriends(next)
        onPermissionsUpdated?.()
        return
      }

      const res = await fetch('/api/admin-editors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin.trim(),
        },
        body: JSON.stringify({ name: target.name, can_edit: nextCanEdit }),
      })
      const json = (await res.json()) as {
        friend?: LocalFriendRecord
        error?: string
      }
      if (!res.ok || !json.friend) {
        setError(json.error || 'Gagal mengubah izin edit.')
        return
      }
      setFriends((prev) =>
        prev.map((f) => (f.name === target.name ? json.friend! : f)),
      )
      onPermissionsUpdated?.()
    } catch {
      setError('Gagal mengubah izin edit.')
    } finally {
      setBusyName(null)
    }
  }

  const handleDeleteFriend = async (targetName: string) => {
    setBusyName(targetName)
    setError('')
    try {
      if (!isSupabaseConfigured) {
        const next = getLocalFriends().filter((f) => f.name !== targetName)
        saveLocalFriends(next)
        setFriends(next)
        onPermissionsUpdated?.()
        return
      }

      const res = await fetch('/api/admin-editors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin.trim(),
        },
        body: JSON.stringify({ name: targetName }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(json.error || 'Gagal menghapus teman.')
        return
      }
      setFriends((prev) => prev.filter((f) => f.name !== targetName))
      onPermissionsUpdated?.()
    } catch {
      setError('Gagal menghapus teman.')
    } finally {
      setBusyName(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-editors-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-ink/55 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-berry px-3 py-1 text-xs font-extrabold text-white shadow-pop-sm">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>KHUSUS ADMIN</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isUnlocked && (
                  <button
                    type="button"
                    onClick={handleLock}
                    title="Kunci Panel Admin"
                    className="pop-press inline-flex items-center gap-1 rounded-xl border-2 border-ink bg-paper px-2.5 py-1.5 text-[11px] font-extrabold text-ink shadow-pop-sm"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Kunci</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Tutup Panel Admin"
                  className="pop-press flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-paper text-ink shadow-pop-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h2
              id="admin-editors-title"
              className="mt-3 font-display text-2xl font-extrabold text-ink"
            >
              Kelola Daftar Teman
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-ink-muted">
              Hanya nama di daftar dengan izin{' '}
              <span className="font-extrabold text-ink">Boleh Edit</span> yang
              bisa menambah &amp; mengedit tempat. Selain itu otomatis jadi Tamu.
            </p>

            {!isUnlocked ? (
              <form onSubmit={handleUnlock} className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-mango">
                  <Lock className="h-4 w-4 shrink-0 text-ink-muted" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value)
                      setError('')
                    }}
                    placeholder="Masukkan PIN Admin..."
                    autoFocus
                    className="w-full bg-transparent text-sm font-bold text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    aria-label={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                    className="text-ink-muted hover:text-ink"
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {!isSupabaseConfigured && (
                  <p className="text-[11px] font-semibold text-ink-muted">
                    Mode Lokal aktif — PIN demo: <code>1234</code>
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border-2 border-ink bg-tomato px-3 py-1.5 text-xs font-bold text-white">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="pop-press inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-mango px-4 py-3 font-display text-sm font-extrabold text-ink shadow-pop disabled:opacity-50"
                >
                  <Unlock className="h-4 w-4" />
                  <span>{isLoading ? 'Memeriksa...' : 'Buka Panel Admin'}</span>
                </button>
              </form>
            ) : (
              <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
                {/* Add new friend form */}
                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tambah nama teman (mis. Raka)"
                    className="min-w-0 flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2 text-sm font-bold text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-mango focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newName.trim()}
                    className="pop-press inline-flex shrink-0 items-center gap-1 rounded-2xl border-2 border-ink bg-pandan px-3.5 py-2 text-xs font-extrabold text-ink shadow-pop-sm disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.75} />
                    <span>Tambah</span>
                  </button>
                </form>

                {error && (
                  <p className="rounded-xl border-2 border-ink bg-tomato px-3 py-1.5 text-xs font-bold text-white">
                    {error}
                  </p>
                )}

                {/* Friends list */}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {friends.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-paper px-4 py-6 text-center text-xs font-semibold text-ink-muted">
                      Belum ada nama teman di daftar. Tambahkan di atas!
                    </div>
                  ) : (
                    friends.map((friend) => {
                      const isBusy = busyName === friend.name
                      return (
                        <div
                          key={friend.name}
                          className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-paper px-3 py-2.5 shadow-pop-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-extrabold text-ink">
                              {friend.name.toLowerCase()}
                            </p>
                            <p className="text-[11px] font-semibold text-ink-muted">
                              {friend.can_edit
                                ? 'Bisa tambah & edit tempat'
                                : 'Hanya lihat & Gacha (Tamu)'}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleCanEdit(friend)}
                              className={cn(
                                'pop-press inline-flex items-center gap-1 rounded-xl border-2 border-ink px-2.5 py-1 text-[11px] font-extrabold shadow-pop-sm disabled:opacity-50',
                                friend.can_edit
                                  ? 'bg-pandan text-ink'
                                  : 'bg-cream-dark text-ink',
                              )}
                            >
                              {friend.can_edit ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Editor</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  <span>Tamu</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteFriend(friend.name)}
                              aria-label={`Hapus ${friend.name}`}
                              className="pop-press flex h-8 w-8 items-center justify-center rounded-xl border-2 border-ink bg-paper text-tomato shadow-pop-sm hover:bg-tomato hover:text-white disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
