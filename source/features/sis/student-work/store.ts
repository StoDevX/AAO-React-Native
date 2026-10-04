import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'
import {createLayoutStore} from '../../../lib/layout-store'

type SeenPostingsStore = {
	/// The postings on the board when the student last left Student Work, or
	/// `null` before they ever have.
	seenIds: string[] | null
	markSeen: (ids: string[]) => void
}

/// What the student has already seen, kept on this device only, so the list
/// can mark what went up since.
export const useSeenPostingsStore = create<SeenPostingsStore>()(
	persist(
		(set) => ({
			seenIds: null,
			markSeen: (ids) => {
				// An empty board is a failed or unfinished load far more often
				// than a real one; remembering it would make every posting new.
				if (ids.length === 0) return
				set({seenIds: ids})
			},
		}),
		{
			name: 'student-work-seen-postings',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)

/// Whether the landing screen draws its areas as tiles or rows, as the
/// student last picked from its layout menu.
export const useAreaLayoutStore = createLayoutStore('student-work-area-layout', 'grid')
