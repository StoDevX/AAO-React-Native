import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {QuickActionId} from '../telemetry/catalog'
import {track} from '../telemetry/track'
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
		(set, get) => ({
			quickActions: DEFAULT_QUICK_ACTIONS,
			toggleQuickAction: (id) => {
				// Count only ids that still name a destination, so one left
				// behind by a renamed tile gives its slot back.
				let current = resolveQuickActions(get().quickActions).map((d) => d.id)
				if (current.includes(id)) {
					set({quickActions: current.filter((picked) => picked !== id)})
					reportToggle(id, 'remove')
					return
				}
				if (current.length >= MAX_QUICK_ACTIONS || resolveQuickActions([id]).length === 0) {
					return
				}
				set({quickActions: [...current, id]})
				reportToggle(id, 'add')
			},
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

/**
 * Counts a pick or an unpick. Only an id `resolveQuickActions` recognised gets
 * here, and every such id is a title the app ships.
 */
function reportToggle(id: string, change: 'add' | 'remove'): void {
	track({name: 'quick_action.toggle', attributes: {action: id as QuickActionId, change}})
}
