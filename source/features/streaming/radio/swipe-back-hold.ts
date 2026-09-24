import {useCallback, useEffect, useRef} from 'react'

/** How long the swipe stays off once the logo has settled. */
const HOLD_MS = 2000

/**
 * Holds off iOS's full-width swipe back while the logo is likely to be
 * scratched: for 2s after the screen opens, for as long as a finger is down,
 * and for 2s after each `settle` -- a new logo, or a scratch that has stopped
 * coasting.
 *
 * Switching the swipe off at touch-down would be too late: iOS decides a drag
 * is a swipe back before the setting reaches it. So it is off ahead of time,
 * and a first scratch after 2s idle still goes back.
 */
export function useSwipeBackHold(setEnabled: (enabled: boolean) => void): {
	hold: () => void
	settle: () => void
} {
	let setEnabledRef = useRef(setEnabled)
	let timer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		setEnabledRef.current = setEnabled
	}, [setEnabled])

	let hold = useCallback(() => {
		if (timer.current) {
			clearTimeout(timer.current)
			timer.current = null
		}
		setEnabledRef.current(false)
	}, [])

	let settle = useCallback(() => {
		hold()
		timer.current = setTimeout(() => {
			timer.current = null
			setEnabledRef.current(true)
		}, HOLD_MS)
	}, [hold])

	useEffect(() => {
		settle()
		return () => {
			if (timer.current) {
				clearTimeout(timer.current)
				timer.current = null
			}
			setEnabledRef.current(true)
		}
	}, [settle])

	return {hold, settle}
}
