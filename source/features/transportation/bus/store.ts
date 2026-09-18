import {create} from 'zustand'

import type {DayOfWeek} from './types'

type BusDayStore = {
	/**
	 * The day the bus screens are showing, or `null` to follow the clock.
	 *
	 * `null` rather than today's weekday so the navigation bar's menu can
	 * label itself without a timer, and so the schedule rolls over at midnight
	 * on its own -- until a day is picked. The menu offers only the seven
	 * weekdays, with no "Today" entry to pick back, so once set this stays
	 * pinned to that day rather than rolling over again.
	 */
	selectedDay: DayOfWeek | null
	setSelectedDay: (day: DayOfWeek | null) => void
}

/**
 * Shared by every bus line, so picking Saturday keeps Saturday as you move
 * between the Express, Red Line, Blue Line and Oles Go tabs. Deliberately
 * unpersisted: the pick is a way of looking around, not a setting.
 */
export const useBusDay = create<BusDayStore>()((set) => ({
	selectedDay: null,
	setSelectedDay: (selectedDay) => set({selectedDay}),
}))
