import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export const APP_FEATURE_VERSION = '2026-11-27-v2'
const WHATS_NEW_KEY = 'isi-perut:whats-new-seen:v1'

export function shouldShowWhatsNew(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(WHATS_NEW_KEY) !== APP_FEATURE_VERSION
  } catch {
    return false
  }
}

export function markWhatsNewSeen(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WHATS_NEW_KEY, APP_FEATURE_VERSION)
  } catch {
    // Ignore storage errors
  }
}

interface WhatsNewModalProps {
  isOpen: boolean
  onAcknowledge: () => void
}

const UPDATES: { emoji: string; title: string; desc: string }[] = [
  {
    emoji: '🎰',
    title: 'Gacha / SpinWheel Random Pick',
    desc: 'Bingung mau makan atau ngopi di mana? Klik tombol Gacha untuk acak tempat berdasarkan kategori!',
  },
  {
    emoji: '📋',
    title: 'Tampilan List Padat',
    desc: 'Mode tampilan baru yang ringkas agar bisa scroll 10+ tempat sekaligus di layar HP.',
  },
  {
    emoji: '🏙️',
    title: 'Jakarta (Blok M) & Filter Nama',
    desc: 'Kini ada pilihan kota Makassar & Jakarta (Blok M), plus filter berdasarkan siapa yang menambahkan.',
  },
  {
    emoji: '📍',
    title: 'Tempat Baru Langsung di Atas',
    desc: 'Setiap tempat baru otomatis muncul di paling atas dan link pendek Google Maps langsung terbaca koordinatnya.',
  },
]

export function WhatsNewModal({ isOpen, onAcknowledge }: WhatsNewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/55 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-t-3xl border-2 border-ink bg-cream p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop-lg md:rounded-3xl"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mango px-3 py-1 text-xs font-extrabold text-ink shadow-pop-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>PEMBARUAN FITUR BARU!</span>
            </div>

            <h2
              id="whats-new-title"
              className="mt-3 font-display text-2xl font-extrabold text-ink"
            >
              Yang Baru di Isi Perut ✨
            </h2>

            <ul className="mt-3.5 space-y-2.5">
              {UPDATES.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-2xl border-2 border-ink bg-paper p-3 shadow-pop-sm"
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-extrabold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-ink-muted">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                markWhatsNewSeen()
                onAcknowledge()
              }}
              className="pop-press mt-4 w-full rounded-2xl border-2 border-ink bg-pandan px-4 py-3 font-display text-sm font-extrabold text-ink shadow-pop"
            >
              Oke, Mengerti!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
