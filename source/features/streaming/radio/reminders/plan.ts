import {TZDateMini} from '@date-fns/tz'
import {addDays, startOfDay} from 'date-fns'
import type {EventType} from '@frogpond/event-type'

import {sameShowTitle} from '../show-titles'
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

/** How far apart a weekly reminder's firings are. */
const WEEK_MS = 7 * 24 * 60 * 60_000

/** `REMINDER_LEAD_MINUTES` in milliseconds. */
const LEAD_MS = REMINDER_LEAD_MINUTES * 60_000

/** The weekly slot of the reminder for a show starting at `start`, in `zone`. */
export function reminderSlot(start: Date, zone: string): ReminderSlot {
	let at = new TZDateMini(start.getTime() - LEAD_MS, zone)
	return {weekday: at.getDay() + 1, hour: at.getHours(), minute: at.getMinutes()}
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

/**
 * The reminders among `identifiers` that no sync can read, such as one on a
 * station a later release dropped. Nothing else could ever cancel them, and
 * no follow is left to show for them.
 */
export function unreadableReminders(identifiers: readonly string[]): string[] {
	return identifiers.filter(
		(identifier) =>
			identifier.startsWith(`${PREFIX}|`) && parseReminderIdentifier(identifier) === null,
	)
}

/** What a reminder says. The station is its title, so the body leaves it out. */
export function reminderBody(title: string): string {
	return `${title} is about to start.`
}

function slotKey(slot: ReminderSlot): string {
	return `${slot.weekday}|${slot.hour}|${slot.minute}`
}

function isFollowed(follows: readonly FollowedShow[], reminder: PendingReminder): boolean {
	return follows.some(
		(show) => show.stationId === reminder.stationId && sameShowTitle(show.title, reminder.title),
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
	let end = addDays(new TZDateMini(last, zone), 1).getTime()
	for (
		let day = addDays(startOfDay(new TZDateMini(first, zone)), -1);
		day.getTime() < end;
		day = addDays(day, 1)
	) {
		if (day.getDay() + 1 !== slot.weekday) {
			continue
		}
		let airing =
			new TZDateMini(
				day.getFullYear(),
				day.getMonth(),
				day.getDate(),
				slot.hour,
				slot.minute,
				zone,
			).getTime() + LEAD_MS
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
			// Keyed by slot, as a reminder made before the station restyled the
			// title has an identifier spelled the old way.
			let wanted = new Map<string, ReminderRequest>()
			let airings = byStart.filter((each) => sameShowTitle(each.title, show.title))
			// A weekly reminder already repeats each airing, so the show's first week
			// holds every slot it needs. A later airing can fall at another hour on
			// the phone, once the station's clocks change and the phone's do not, and
			// its slot would fire beside the first one from the coming week on.
			let weekEnd = (airings[0]?.startTime.valueOf() ?? 0) + WEEK_MS
			for (let event of airings.filter((each) => each.startTime.valueOf() < weekEnd)) {
				let slot = reminderSlot(event.startTime.toDate(), zone)
				wanted.set(slotKey(slot), {
					identifier: reminderIdentifier(show.stationId, show.title, slot),
					stationId: show.stationId,
					title: show.title,
					slot,
					stationName: feed.stationName,
					body: reminderBody(event.title),
				})
			}

			let mine = pending.filter(
				(reminder) =>
					reminder.stationId === show.stationId && sameShowTitle(reminder.title, show.title),
			)
			for (let reminder of mine) {
				if (wanted.has(slotKey(reminder.slot))) {
					wanted.delete(slotKey(reminder.slot))
				} else if (feedCovers(feed.events, reminder.slot, zone)) {
					cancel.push(reminder.identifier)
				}
			}
			schedule.push(...wanted.values())
		}
	}
	return {schedule, cancel}
}
