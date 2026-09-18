import type {Moment} from 'moment-timezone'
import type {BuildingType, ServiceStatusType} from '../types'

import {findOpenWindow} from './find-open-window'

/**
 * What a building is reachable by right now that is not a door, or null.
 *
 * A set only counts when it says what it is: a set marked not physically open
 * but carrying no `status` has nothing to call itself on the status line, so it
 * stays silent rather than guessing.
 */
export function findOpenService(building: BuildingType, m: Moment): ServiceStatusType | null {
	for (let set of building.schedule || []) {
		if (set.isPhysicallyOpen !== false) continue
		if (!set.status) continue

		let running = set.hours.some((hours) => findOpenWindow(hours, m) !== null)
		if (running) {
			return set.status
		}
	}

	return null
}
