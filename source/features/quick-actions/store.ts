import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {QuickActionId} from '../telemetry/catalog'
import {track} from '../telemetry/track'
import type {CampusDefinition} from '../../campuses'
import {
	DEFAULT_CARLETON_QUICK_ACTIONS,
	DEFAULT_QUICK_ACTIONS,
	defaultQuickActions,
	isStOlafsQuickActions,
	MAX_QUICK_ACTIONS,
	resolveQuickActions,
} from './destinations'

type QuickActionsStore = {
	/** Ids of St. Olaf's picked destinations, in the order the Home Screen menu shows them. */
	quickActions: string[]
	/**
	 * Carleton's picks, kept apart so switching campus and back leaves each
	 * campus's choices as they were.
	 */
	carletonQuickActions: string[]
	/** Pick `id` on `campus`, or unpick it if already picked. Does nothing when every slot is taken. */
	toggleQuickAction: (id: string, campus: CampusDefinition) => void
	resetQuickActions: (campus: CampusDefinition) => void
}

/** The ids picked on `campus`. */
export function pickedFor(
	state: Pick<QuickActionsStore, 'quickActions' | 'carletonQuickActions'>,
	campus: CampusDefinition,
): string[] {
	return isStOlafsQuickActions(campus) ? state.quickActions : state.carletonQuickActions
}

function setPicked(campus: CampusDefinition, ids: string[]): Partial<QuickActionsStore> {
	return isStOlafsQuickActions(campus) ? {quickActions: ids} : {carletonQuickActions: ids}
}

export const useQuickActionsStore = create<QuickActionsStore>()(
	persist(
		(set, get) => ({
			quickActions: DEFAULT_QUICK_ACTIONS,
			carletonQuickActions: DEFAULT_CARLETON_QUICK_ACTIONS,
			toggleQuickAction: (id, campus) => {
				// Count only ids that still name a destination, so one left
				// behind by a renamed tile gives its slot back.
				let current = resolveQuickActions(pickedFor(get(), campus), campus).map((d) => d.id)
				if (current.includes(id)) {
					set(
						setPicked(
							campus,
							current.filter((picked) => picked !== id),
						),
					)
					reportToggle(id, 'remove')
					return
				}
				if (current.length >= MAX_QUICK_ACTIONS || resolveQuickActions([id], campus).length === 0) {
					return
				}
				set(setPicked(campus, [...current, id]))
				reportToggle(id, 'add')
			},
			resetQuickActions: (campus) => set(setPicked(campus, defaultQuickActions(campus))),
		}),
		{
			name: 'quick-actions',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({
				quickActions: state.quickActions,
				carletonQuickActions: state.carletonQuickActions,
			}),
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
