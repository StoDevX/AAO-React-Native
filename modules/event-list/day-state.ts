import type {Moment} from 'moment-timezone'

import type {CalendarSource, SourcedEvent} from './types'

/**
 * What a day with no rows should say, and whether it can be retried.
 *
 * A description rather than a view: which notice a day earns is decided in
 * JavaScript and can be asserted directly, while what it looks like on screen
 * is a matter for a device.
 */
export interface DayNotice {
	readonly text: string
	readonly retry: boolean
}

/** What the screen has to work with when it draws a day. */
export interface DayState {
	readonly message?: string
	readonly sources: readonly CalendarSource[]
	readonly failed: readonly CalendarSource[]
	readonly isLoading?: boolean
	readonly events: readonly SourcedEvent[]
}

/**
 * The notice a view shows when it has no rows, given what it would say if the
 * only thing wrong were that nothing is on.
 *
 * Both views decide this the same way and differ only in that last line: one
 * names the day it is empty for, the other offers to load again. So the order
 * lives here once -- and the order is the point. A calendar that failed to load
 * is worth naming even when it left nothing else to show, or "every source
 * errored" and "nothing is on today" read as the same bare line. Having no
 * calendars on at all offers no retry: there is nothing to reload, and the way
 * out is the Calendars button.
 */
export function emptyNotice(state: DayState, whenEmpty: DayNotice): DayNotice {
	if (state.message) {
		return {text: state.message, retry: false}
	}

	if (state.sources.length === 0) {
		return {
			text: 'No calendars are showing. Choose some from the Calendars button below.',
			retry: false,
		}
	}

	if (state.events.length === 0 && state.failed.length > 0) {
		return {
			text: `Could not load ${state.failed.map((source) => source.title).join(', ')}.`,
			retry: true,
		}
	}

	if (state.events.length === 0 && state.isLoading) {
		return {text: 'Loading…', retry: false}
	}

	return whenEmpty
}

/**
 * The days mounted as pages, around `anchor`.
 *
 * The anchor trails the selection so the set holds still while a swipe
 * animates -- but whatever it is built around, `selected` has to be in the
 * result. A day that is not mounted leaves the pager seeded with a value no
 * page carries, and nothing is drawn for it.
 *
 * Corrected here rather than at each handler. A handler can only correct what
 * it is told about, and some of this arrives without one: the clock ticks every
 * minute, so a calendar left open across midnight drops a day out of range with
 * nothing running at all.
 */
export function pageWindow(
	days: readonly Moment[],
	anchor: Moment | null,
	selected: Moment | null,
	radius: number,
): Moment[] {
	let around = (day: Moment | null): Moment[] => {
		if (!day) return [...days]

		let middle = days.findIndex((one) => one.isSame(day, 'day'))
		if (middle < 0) return days.slice(0, radius * 2 + 1)

		return days.slice(Math.max(0, middle - radius), middle + radius + 1)
	}

	let trailing = around(anchor ?? selected)
	if (!selected || trailing.some((day) => day.isSame(selected, 'day'))) {
		return trailing
	}

	return around(selected)
}

/**
 * Whether the anchor should move on, given where the chosen day sits in the
 * window. `pageWindow` would hold the day either way; moving the anchor early
 * keeps that correction from firing mid-swipe, where a changed set of pages is
 * a second thing to animate.
 */
export function anchorShouldFollow(pages: readonly Moment[], day: Moment, margin: number): boolean {
	let edge = pages.findIndex((page) => page.isSame(day, 'day'))
	return edge < 0 || edge < margin || edge > pages.length - 1 - margin
}

/**
 * The day a view of `days` should be showing, given what was chosen.
 *
 * A chosen day the range no longer offers is ignored rather than cleared, so
 * widening a filter again returns the reader to where they were.
 */
export function dayOnShow(
	days: readonly Moment[],
	chosen: Moment | null,
	now: Moment,
): Moment | null {
	if (chosen && days.some((day) => day.isSame(chosen, 'day'))) {
		return chosen
	}

	return days.find((day) => day.isSame(now, 'day')) ?? days[0] ?? null
}
