import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UserProfile } from '@/types'
import { CaseMeta } from '@/services/firebase/firestore'

// ─── Auth Slice ───────────────────────────────────────────────────────────────

interface AuthSlice {
  user: UserProfile | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
}

// ─── Wallet Slice ─────────────────────────────────────────────────────────────

interface WalletSlice {
  address: string | null
  connected: boolean
  setAddress: (address: string | null) => void
  setConnected: (connected: boolean) => void
}

// ─── UI Slice ─────────────────────────────────────────────────────────────────

interface UISlice {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// ─── Case Cache Slice ─────────────────────────────────────────────────────────

interface CaseCacheSlice {
  caseCache: Record<string, CaseMeta>
  setCaseCache: (cases: CaseMeta[]) => void
  getCachedCase: (caseId: string) => CaseMeta | undefined
}

// ─── Combined Store ───────────────────────────────────────────────────────────

interface StoreState extends AuthSlice, WalletSlice, UISlice, CaseCacheSlice {}

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Auth
        user: null,
        loading: true,
        setUser: (user) => set({ user }),
        setLoading: (loading) => set({ loading }),

        // Wallet
        address: null,
        connected: false,
        setAddress: (address) => set({ address }),
        setConnected: (connected) => set({ connected }),

        // UI
        sidebarOpen: true,
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

        // Case Cache
        caseCache: {},
        setCaseCache: (cases) => {
          const cache: Record<string, CaseMeta> = {}
          for (const c of cases) cache[c.caseId] = c
          set({ caseCache: { ...get().caseCache, ...cache } })
        },
        getCachedCase: (caseId) => get().caseCache[caseId],
      }),
      {
        name: 'cjp-store',
        partialize: (state) => ({
          address: state.address,
          sidebarOpen: state.sidebarOpen,
          caseCache: state.caseCache,
        }),
      }
    )
  )
)
