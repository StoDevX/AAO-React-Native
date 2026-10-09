import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

import type {CampusDefinition, CampusId} from '../../campuses'
import type {QuickActionId} from '../telemetry/catalog'
import {track} from '../telemetry/track'
import {MAX_QUICK_ACTIONS, resolveQuickActions} from './destinations'

type QuickActionsStore = {
	/**
	 * Each campus's picked destination ids, in the order the Home Screen menu
	 * shows them. A campus no one has picked on yet is absent, and shows its
	 * defaults; switching campus and back leaves each campus's picks alone.
	 */
	picked: Partial<Record<CampusId, string[]>>
	/** Pick `id` on `campus`, or unpick it if already picked. Does nothing when every slot is taken. */
	toggleQuickAction: (id: string, campus: CampusDefinition) => void
	resetQuickActions: (campus: CampusDefinition) => void
}

/** Kept as one array, so a campus without defaults hands back the same one each time. */
const NONE: ReadonlyArray<string> = []

/**
 * The ids picked on `campus`, or its defaults. The defaults come back as the
 * definition's own array, so a store selector sees the same value each time
 * rather than a fresh one, which would re-render forever under zustand 5.
 */
export function pickedFor(
	state: Pick<QuickActionsStore, 'picked'>,
	campus: CampusDefinition,
): ReadonlyArray<string> {
	return state.picked[campus.id] ?? campus.quickActions?.defaults ?? NONE
}

export const useQuickActionsStore = create<QuickActionsStore>()(
	persist(
		(set, get) => ({
			picked: {},
			toggleQuickAction: (id, campus) => {
				// Count only ids that still name a destination, so one left
				// behind by a renamed tile gives its slot back.
				let current = resolveQuickActions(pickedFor(get(), campus), campus).map((d) => d.id)
				let save = (ids: string[]) => set({picked: {...get().picked, [campus.id]: ids}})
				if (current.includes(id)) {
					save(current.filter((picked) => picked !== id))
					reportToggle(id, 'remove')
					return
				}
				if (current.length >= MAX_QUICK_ACTIONS || resolveQuickActions([id], campus).length === 0) {
					return
				}
				save([...current, id])
				reportToggle(id, 'add')
			},
			resetQuickActions: (campus) => {
				let {[campus.id]: _reset, ...others} = get().picked
				set({picked: others})
			},
		}),
		{
			name: 'quick-actions',
			storage: createJSONStorage(() => AsyncStorage),
			// Version 1 kept St. Olaf's and Carleton's picks in fields of their
			// own, and only 2.9 TestFlight builds wrote it: its picks are dropped,
			// not carried over, and each campus starts again from its defaults.
			version: 2,
			migrate: () => ({picked: {}}),
			partialize: (state) => ({picked: state.picked}),
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
