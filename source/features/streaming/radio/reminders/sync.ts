import * as Sentry from '@sentry/react-native'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {queryClient} from '../../../../init/tanstack-query'
import {STATIONS, type StationId} from '../stations'
import {useRadioStore} from '../store'
import {stationScheduleOptions} from '../use-station-schedule'
import {applyReminderChanges, pendingReminders, reminderPermission} from './notifications'
import {planReminderChanges, type StationFeed} from './plan'

/** How old a loaded schedule may be before a sync asks for it again. */
const SCHEDULE_FRESH_MS = 15 * 60_000

/**
 * `stationId`'s schedule, from the cache while fresh. Offline, or when the
 * server fails, it is whatever the cache last held; null when there is none.
 */
async function stationFeed(stationId: StationId): Promise<StationFeed | null> {
	let station = STATIONS[stationId]
	let options = stationScheduleOptions(station.schedule)
	if (!options.enabled) {
		return null
	}
	let feed = (events: EventType[]) => ({stationId, stationName: station.stationName, events})
	try {
		// 'always', so a fetch made offline fails at once rather than pausing
		// until the network returns, holding every later sync behind it.
		let sourced = await queryClient.query({
			...options,
			staleTime: SCHEDULE_FRESH_MS,
			networkMode: 'always',
		})
		return feed(sourced.map((each) => each.event))
	} catch {
		let cached = queryClient.getQueryData(options.queryKey)
		let sourced = cached === undefined ? undefined : options.select?.(cached)
		// A station whose schedule cannot load keeps the reminders it has.
		return sourced === undefined ? null : feed(sourced.map((each) => each.event))
	}
}

async function syncOnce(): Promise<void> {
	let follows = useRadioStore.getState().followedShows
	// The zone is guessed afresh, as a phone that crossed one while the app
	// stayed alive must move its reminders with it.
	let zone = moment.tz.guess(true)
	// An unfollowed show's reminders go before anything waits on a schedule.
	await applyReminderChanges(
		planReminderChanges({
			follows,
			feeds: [],
			pending: await pendingReminders(),
			granted: false,
			zone,
		}),
	)

	let stationIds = [...new Set(follows.map((show) => show.stationId))]
	let [permission, pending, ...feeds] = await Promise.all([
		reminderPermission(),
		pendingReminders(),
		...stationIds.map(stationFeed),
	])
	// The bells read this, so one turned on or off in Settings shows on return.
	useRadioStore.getState().setReminderPermission(permission)
	let changes = planReminderChanges({
		follows,
		feeds: feeds.filter((feed) => feed !== null),
		pending,
		granted: permission === 'granted',
		zone,
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
	running = syncUntilSettled()
		// A failed sync is reported, never left to reject unhandled: the next
		// app-active or follow tries again.
		.catch((error: unknown) => {
			Sentry.captureException(error)
		})
		.finally(() => {
			running = null
		})
	return running
}
