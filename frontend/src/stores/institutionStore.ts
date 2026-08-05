import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INSTITUTION_ID, getInstitution } from '@/lib/institutions'
import type { Institution } from '@/lib/institutions'

interface InstitutionState {
  institutionId: string
  institution: Institution
  setInstitution: (id: string) => void
}

export const useInstitutionStore = create<InstitutionState>()(
  persist(
    (set) => ({
      institutionId: DEFAULT_INSTITUTION_ID,
      institution: getInstitution(DEFAULT_INSTITUTION_ID),
      setInstitution: (id) =>
        set({ institutionId: id, institution: getInstitution(id) }),
    }),
    {
      name: 'tss-institution',
      partialize: (state) => ({ institutionId: state.institutionId }),
      onRehydrateStorage: () => (state) => {
        // Recompute the full institution record from the persisted id,
        // so edits to INSTITUTIONS data are always reflected.
        if (state) state.institution = getInstitution(state.institutionId)
      },
    },
  ),
)
