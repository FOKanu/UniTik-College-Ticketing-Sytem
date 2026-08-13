import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_INSTITUTION_ID,
  findInstitution,
  type Institution,
} from '@/lib/institutions'

interface InstitutionState {
  institutionId: string
  setInstitutionId: (id: string) => void
  /** Alias used by earlier main call sites. */
  setInstitution: (id: string) => void
  getInstitution: () => Institution
  clearInstitution: () => void
}

export const useInstitutionStore = create<InstitutionState>()(
  persist(
    (set, get) => ({
      institutionId: DEFAULT_INSTITUTION_ID,
      setInstitutionId: (id) => {
        const next = findInstitution(id)
        set({ institutionId: next.id })
      },
      setInstitution: (id) => {
        const next = findInstitution(id)
        set({ institutionId: next.id })
      },
      getInstitution: () => findInstitution(get().institutionId),
      clearInstitution: () => set({ institutionId: DEFAULT_INSTITUTION_ID }),
    }),
    {
      name: 'tss-institution',
      partialize: (state) => ({ institutionId: state.institutionId }),
    },
  ),
)
