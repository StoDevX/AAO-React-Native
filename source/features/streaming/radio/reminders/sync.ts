import moment from 'moment-timezone'

import {queryClient} from '../../../../init/tanstack-query'
import {STATIONS, type StationId} from '../stations'
import {useRadioStore} from '../store'
import {stationScheduleOptions} from '../use-station-schedule'
import {applyReminderChanges, pendingReminders, reminderPermission} from './notifications'
import {planReminderChanges, type StationFeed} from './plan'

/** How old a loaded schedule may be before a sync asks for it again. */
const SCHEDULE_FRESH_MS = 15 * 60_000

/** `stationId`'s schedule, from the cache while fresh; null when it cannot be loaded. */
async function stationFeed(stationId: StationId): Promise<StationFeed | null> {
	let station = STATIONS[stationId]
	let options = stationScheduleOptions(station.schedule)
	if (!options.enabled) {
		return null
	}
	try {
		let sourced = await queryClient.query({...options, staleTime: SCHEDULE_FRESH_MS})
		let events = sourced.map((each) => each.event)
		return {stationId, stationName: station.stationName, events}
	} catch {
		// A station whose schedule cannot load keeps the reminders it has.
		return null
	}
}

async function syncOnce(): Promise<void> {
	let follows = useRadioStore.getState().followedShows
	let stationIds = [...new Set(follows.map((show) => show.stationId))]
	let [permission, pending, ...feeds] = await Promise.all([
		reminderPermission(),
		pendingReminders(),
		...stationIds.map(stationFeed),
	])
	let changes = planReminderChanges({
		follows,
		feeds: feeds.filter((feed) => feed !== null),
		pending,
		granted: permission === 'granted',
		zone: moment.tz.guess(),
	})
	await applyReminderChanges(changes)
}

let running: Promise<void> | null = null
let again = false

/** Syncs, and again for as long as calls keep arriving while it does. */
async function syncUntilSettled(): Promise<void> {
	again = false
	await syncOnce()
	if (again) {
		await syncUntilSettled()
	}
}

/**
 * Brings the scheduled reminders in line with the shows followed, the
 * permission given, and each followed station's schedule. A call made while
 * one runs is folded into a single run after it, so two never interleave.
 */
export function syncShowReminders(): Promise<void> {
	if (running) {
		again = true
		return running
	}
	running = syncUntilSettled().finally(() => {
		running = null
	})
	return running
}
