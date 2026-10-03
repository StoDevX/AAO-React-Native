import * as React from 'react'
import {useRadioStore} from '../streaming/radio/store'
import {reportRadioPlayerChange} from './telemetry'

/**
 * Whether Home shows the radio player, and a way to change it that counts the
 * change. Turning it off also stops the radio; see `setShowOnHome`.
 */
export function useRadioPlayerSetting(): [boolean, (shown: boolean) => void] {
	let shown = useRadioStore((state) => state.showOnHome)
	let setShowOnHome = useRadioStore((state) => state.setShowOnHome)

	let set = React.useCallback(
		(next: boolean) => {
			setShowOnHome(next)
			reportRadioPlayerChange(next)
		},
		[setShowOnHome],
	)

	return [shown, set]
}
