import {useCallback, useEffect, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {default as moment, unitOfTime, type Moment} from 'moment-timezone'

import {isUITesting} from '@frogpond/launch-arguments'
import {useNowOverride} from './override'

/**
 * Frozen date for UI testing. Tests run against fixture data anchored to this
 * date, so scrolling/today behavior is predictable.
 */
export const UITEST_FROZEN_DATE = '2026-09-05T12:00:00-05:00'

/**
 * Returns the current moment, or the frozen date in UI testing mode.
 */
export function now(): Moment {
	// `clone()` because a Moment is mutable and callers chain `.startOf()` and
	// `.tz()` onto what they get back -- handing out the stored one would let
	// any of them rewrite the override for the whole app.
	let frozen = useNowOverride.getState().frozen
	if (frozen) {
		return frozen.clone()
	}
	return isUITesting ? moment(UITEST_FROZEN_DATE) : moment()
}

interface BasicProps {
	intervalMs: number // ms
}

interface MomentProps extends BasicProps {
	timezone?: string
	startOf?: unitOfTime.StartOf
}

/**
 * Runs `onTick` on each wall-clock boundary of `intervalMs` — a minute-long
 * interval fires as the minute turns over, not a minute after the screen
 * mounted. Anchoring to mount instead leaves the displayed time trailing the
 * real one by however far into the minute the screen happened to open.
 *
 * Boundaries are measured against the epoch, which lines up with local time
 * because every timezone offset is a whole number of minutes.
 *
 * Timers do not run while the app is in the background, so `onTick` also runs
 * on the way back to the foreground — otherwise the screen keeps whatever time
 * it showed when the user left, for as long as it takes the next boundary to
 * come around.
 */
function useBoundaryInterval(onTick: () => void, intervalMs: number): void {
	let savedTick = useRef(onTick)

	useEffect(() => {
		savedTick.current = onTick
	}, [onTick])

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>

		let scheduleTick = () => {
			timeout = setTimeout(
				() => {
					savedTick.current()
					scheduleTick()
				},
				intervalMs - (Date.now() % intervalMs),
			)
		}

		scheduleTick()

		let subscription = AppState.addEventListener('change', (status) => {
			if (status === 'active') savedTick.current()
		})

		return () => {
			clearTimeout(timeout)
			subscription.remove()
		}
	}, [intervalMs])
}

export function useDateTimer(props: BasicProps): {now: Date} {
	let {intervalMs} = props
	let frozenDate = isUITesting ? new Date(UITEST_FROZEN_DATE) : null
	let [now, setNow] = useState(() => frozenDate ?? new Date())

	useBoundaryInterval(() => {
		if (!frozenDate) {
			setNow(new Date())
		}
	}, intervalMs)

	return {now}
}

export function useMomentTimer(props: MomentProps): {now: Moment} {
	let {intervalMs, timezone, startOf} = props

	let currentMoment = useCallback((): Moment => {
		let frozen = useNowOverride.getState().frozen
		let next = frozen ? frozen.clone() : isUITesting ? moment(UITEST_FROZEN_DATE) : moment()
		if (timezone) {
			next = next.tz(timezone)
		}
		if (startOf) {
			next = next.startOf(startOf)
		}
		return next
	}, [timezone, startOf])

	let [now, setNow] = useState(currentMoment)

	// `getState()` reads without subscribing, so a screen already on-screen when
	// the clock is frozen would keep the old time until its next tick -- which,
	// on a frozen clock, never comes.
	let frozen = useNowOverride((state) => state.frozen)
	useEffect(() => {
		setNow(currentMoment())
	}, [frozen, currentMoment])

	useBoundaryInterval(() => {
		// Hold onto the existing moment when the clock has not actually moved, so
		// consumers watching `now` by identity don't re-render for nothing.
		// In UI testing mode, time is frozen so no updates needed.
		if (isUITesting) return
		setNow((previous) => {
			let next = currentMoment()
			return previous.isSame(next) ? previous : next
		})
	}, intervalMs)

	return {now}
}
