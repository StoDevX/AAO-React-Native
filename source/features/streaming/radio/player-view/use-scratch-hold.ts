import * as React from 'react'

/** How long the sheet and its scroll stay held after a finger lifts or the sheet opens. */
const HOLD_MS = 2000

/**
 * Whether the sheet's scroll and swipe-to-close are held off, so a scratch on
 * the record is not taken by them: for 2s after the sheet opens, for as long
 * as a finger is on the record, and for 2s after it lifts.
 *
 * Switching them off at touch-down would be too late: iOS decides a drag is a
 * scroll or a swipe to close before the setting reaches it. So they are off
 * ahead of time, and a first scratch after 2s idle can still move the sheet.
 */
export function useScratchHold(open: boolean): {
	held: boolean
	/** Told when a finger lands on the record and when it lifts. */
	onHeldChange: (fingerDown: boolean) => void
} {
	let [held, setHeld] = React.useState(false)
	let [wasOpen, setWasOpen] = React.useState(open)
	let timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	// Opening holds at once, in the render that opens it, so no frame is
	// scratchable before the timer starts.
	if (open !== wasOpen) {
		setWasOpen(open)
		if (open) {
			setHeld(true)
		}
	}

	let clear = React.useCallback(() => {
		if (timer.current) {
			clearTimeout(timer.current)
			timer.current = null
		}
	}, [])

	let releaseAfterDelay = React.useCallback(() => {
		clear()
		timer.current = setTimeout(() => {
			timer.current = null
			setHeld(false)
		}, HOLD_MS)
	}, [clear])

	let onHeldChange = React.useCallback(
		(fingerDown: boolean) => {
			if (fingerDown) {
				clear()
				setHeld(true)
			} else {
				setHeld(true)
				releaseAfterDelay()
			}
		},
		[clear, releaseAfterDelay],
	)

	React.useEffect(() => {
		if (open) {
			releaseAfterDelay()
		}
		return clear
	}, [open, releaseAfterDelay, clear])

	// A closed sheet holds nothing, whatever a finger or a timer left behind.
	return {held: open && held, onHeldChange}
}
