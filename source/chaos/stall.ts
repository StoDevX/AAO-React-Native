import {reportFinding} from './findings'

/** What the stall watch needs from React Native. */
export type StallHost = {
	setInterval: (tick: () => void, ms: number) => unknown
	now: () => number
	onAppStateChange: (listener: () => void) => void
}

/** How often the watch's timer is due. */
export const STALL_TICK_MS = 250

/** How late a tick must be to count as the JS thread stalling. */
export const STALL_THRESHOLD_MS = 1000

/**
 * Records a `stall` finding when the JS thread is busy long enough to make a
 * timer more than a second late.
 *
 * A suspended app's timer is late too, when it returns from the background.
 * Its AppState change arrives about then, before or after the late tick, so a
 * late tick waits one more tick and is dropped if the app state changed at
 * any point since the stall began.
 */
export function watchForStalls(host: StallHost): void {
	let last = host.now()
	let lastAppStateChange = Number.NEGATIVE_INFINITY
	let pending: {started: number; late: number} | null = null

	host.onAppStateChange(() => {
		lastAppStateChange = host.now()
	})

	host.setInterval(() => {
		let now = host.now()
		if (pending && lastAppStateChange < pending.started) {
			reportFinding('stall', `JS stalled ${pending.late}ms`)
		}
		pending = null
		let late = now - last - STALL_TICK_MS
		if (late > STALL_THRESHOLD_MS && lastAppStateChange < last) {
			pending = {started: last, late: Math.round(late)}
		}
		last = now
	}, STALL_TICK_MS)
}
