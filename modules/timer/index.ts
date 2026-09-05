import {useCallback, useEffect, useRef, useState} from 'react'
import {default as moment, unitOfTime, type Moment} from 'moment-timezone'

import {isUITesting} from '@frogpond/launch-arguments'

/**
 * Frozen date for UI testing. Tests run against fixture data anchored to this
 * date, so scrolling/today behavior is predictable.
 */
export const UITEST_FROZEN_DATE = '2026-09-05T12:00:00-05:00'

/**
 * Returns the current moment, or the frozen date in UI testing mode.
 */
export function now(): Moment {
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

		return () => clearTimeout(timeout)
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
		let next = isUITesting ? moment(UITEST_FROZEN_DATE) : moment()
		if (timezone) {
			next = next.tz(timezone)
		}
		if (startOf) {
			next = next.startOf(startOf)
		}
		return next
	}, [timezone, startOf])

	let [now, setNow] = useState(currentMoment)

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
