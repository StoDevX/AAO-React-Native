import moment, {type Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {STATIONS, type StationId} from '../stations'
import type {FollowedShow} from '../store'

/** How long before a show starts its reminder arrives. */
export const REMINDER_LEAD_MINUTES = 1

/** What every reminder's identifier starts with, so other notifications are never touched. */
const PREFIX = 'radio-reminder'

/**
 * When a weekly reminder fires, in the device's zone: `weekday` 1 is Sunday
 * through 7, Saturday, as a weekly notification trigger numbers them.
 */
export type ReminderSlot = {weekday: number; hour: number; minute: number}

/** A reminder already scheduled, read back from its identifier. */
export type PendingReminder = {
	identifier: string
	stationId: StationId
	title: string
	slot: ReminderSlot
}

/** A reminder to schedule. */
export type ReminderRequest = PendingReminder & {stationName: string; body: string}

/** A station's schedule as the app last loaded it. */
export type StationFeed = {stationId: StationId; stationName: string; events: readonly EventType[]}

/** The weekly slot of the reminder for a show starting at `start`, in `zone`. */
export function reminderSlot(start: Moment, zone: string): ReminderSlot {
	let at = start.clone().tz(zone).subtract(REMINDER_LEAD_MINUTES, 'minutes')
	return {weekday: at.day() + 1, hour: at.hour(), minute: at.minute()}
}

/** The identifier of `title`'s reminder on `stationId` at `slot`. The title goes last, as it may hold anything. */
export function reminderIdentifier(
	stationId: StationId,
	title: string,
	slot: ReminderSlot,
): string {
	return [PREFIX, stationId, slot.weekday, slot.hour, slot.minute, title].join('|')
}

/** The reminder `identifier` names, or null for a notification that is not one of ours. */
export function parseReminderIdentifier(identifier: string): PendingReminder | null {
	let [prefix, stationId, weekday, hour, minute, ...title] = identifier.split('|')
	if (prefix !== PREFIX || stationId === undefined || !(stationId in STATIONS)) {
		return null
	}
	let slot = {weekday: Number(weekday), hour: Number(hour), minute: Number(minute)}
	if (!Object.values(slot).every(Number.isInteger) || title.length === 0) {
		return null
	}
	return {identifier, stationId: stationId as StationId, title: title.join('|'), slot}
}

/** What a reminder says. */
export function reminderBody(title: string, stationName: string): string {
	return `${title} is about to start on ${stationName}.`
}

function isFollowed(follows: readonly FollowedShow[], reminder: PendingReminder): boolean {
	return follows.some(
		(show) => show.stationId === reminder.stationId && show.title === reminder.title,
	)
}

/**
 * Whether a show reminded at `slot` would air between the feed's first and
 * last show, which is the stretch the feed lists every show for.
 */
function feedCovers(events: readonly EventType[], slot: ReminderSlot, zone: string): boolean {
	if (events.length === 0) {
		return false
	}
	let starts = events.map((event) => event.startTime.valueOf())
	let first = Math.min(...starts)
	let last = Math.max(...starts)
	// A day either side, as the reminder's minute can fall on the day before the show's.
	let day = moment(first).tz(zone).startOf('day').subtract(1, 'day')
	let end = moment(last).tz(zone).add(1, 'day')
	for (; day.isBefore(end); day.add(1, 'day')) {
		if (day.day() + 1 !== slot.weekday) {
			continue
		}
		let airing = day
			.clone()
			.set({hour: slot.hour, minute: slot.minute, second: 0, millisecond: 0})
			.add(REMINDER_LEAD_MINUTES, 'minutes')
			.valueOf()
		if (airing >= first && airing <= last) {
			return true
		}
	}
	return false
}

/**
 * The reminders to schedule and cancel to bring what is pending in line with
 * the shows followed and the schedules loaded. A show's reminder is only
 * dropped when its feed spans a time it would air and the show is not there:
 * a feed reaching a few days ahead says nothing of the shows beyond it.
 */
export function planReminderChanges(input: {
	follows: readonly FollowedShow[]
	feeds: readonly StationFeed[]
	pending: readonly PendingReminder[]
	granted: boolean
	zone: string
}): {schedule: ReminderRequest[]; cancel: string[]} {
	let {follows, feeds, pending, granted, zone} = input
	let cancel = pending
		.filter((reminder) => !isFollowed(follows, reminder))
		.map((reminder) => reminder.identifier)
	let schedule: ReminderRequest[] = []
	if (!granted) {
		return {schedule, cancel}
	}

	for (let feed of feeds) {
		let byStart = [...feed.events].sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf())
		for (let show of follows.filter((each) => each.stationId === feed.stationId)) {
			let wanted = new Map<string, ReminderRequest>()
			for (let event of byStart.filter((each) => each.title === show.title)) {
				let slot = reminderSlot(event.startTime, zone)
				let identifier = reminderIdentifier(show.stationId, show.title, slot)
				wanted.set(identifier, {
					identifier,
					stationId: show.stationId,
					title: show.title,
					slot,
					stationName: feed.stationName,
					body: reminderBody(show.title, feed.stationName),
				})
			}

			let mine = pending.filter(
				(reminder) => reminder.stationId === show.stationId && reminder.title === show.title,
			)
			for (let reminder of mine) {
				if (!wanted.has(reminder.identifier) && feedCovers(feed.events, reminder.slot, zone)) {
					cancel.push(reminder.identifier)
				}
			}
			let scheduled = new Set(mine.map((reminder) => reminder.identifier))
			schedule.push(...[...wanted.values()].filter((each) => !scheduled.has(each.identifier)))
		}
	}
	return {schedule, cancel}
}
