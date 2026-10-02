import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import {DEFAULT_QUICK_ACTIONS, MAX_QUICK_ACTIONS, resolveQuickActions} from './destinations'

type QuickActionsStore = {
	/** Ids of the picked destinations, in the order the Home Screen menu shows them. */
	quickActions: string[]
	/** Pick `id`, or unpick it if already picked. Does nothing when every slot is taken. */
	toggleQuickAction: (id: string) => void
	resetQuickActions: () => void
}

export const useQuickActionsStore = create<QuickActionsStore>()(
	persist(
		(set) => ({
			quickActions: DEFAULT_QUICK_ACTIONS,
			toggleQuickAction: (id) =>
				set((state) => {
					// Count only ids that still name a destination, so one left
					// behind by a renamed tile gives its slot back.
					let current = resolveQuickActions(state.quickActions).map((d) => d.id)
					if (current.includes(id)) {
						return {quickActions: current.filter((picked) => picked !== id)}
					}
					if (current.length >= MAX_QUICK_ACTIONS || resolveQuickActions([id]).length === 0) {
						return {}
					}
					return {quickActions: [...current, id]}
				}),
			resetQuickActions: () => set({quickActions: DEFAULT_QUICK_ACTIONS}),
		}),
		{
			name: 'quick-actions',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({quickActions: state.quickActions}),
		},
	),
)
