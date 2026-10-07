import * as React from 'react'
import {changeIcon, getIcon, resetIcon} from 'react-native-change-icon'
import {type AppIconName, DEFAULT_ICON} from '../../../images/icons'
import {reportIconChange} from './telemetry'
import {type IconEntry, currentIconEntry} from './icons'

/**
 * The icon iOS has set, and a way to change it. Re-reads iOS after a change
 * rather than trusting the request, since the user can refuse it.
 */
export function useAppIcon(): {
	current: IconEntry
	apply: (type: AppIconName) => Promise<void>
	reload: () => Promise<void>
} {
	let [current, setCurrent] = React.useState<IconEntry>(() => currentIconEntry('Default'))

	let reload = React.useCallback(async () => {
		setCurrent(currentIconEntry(await getIcon()))
	}, [])

	React.useEffect(() => {
		// `reload` awaits getIcon() before setting state, so nothing is set
		// synchronously in the effect.
		// oxlint-disable-next-line react/set-state-in-effect
		reload()
	}, [reload])

	let apply = React.useCallback(
		async (type: AppIconName) => {
			// iOS rejects a change to the icon already set, so choosing it again does nothing.
			if (type === current.type) {
				return
			}
			try {
				if (type === DEFAULT_ICON) {
					await resetIcon()
				} else {
					await changeIcon(type)
				}
				reportIconChange(type)
			} catch {
				// iOS refused the change; the reload below shows the icon it kept.
			}
			await reload()
		},
		[current.type, reload],
	)

	return {current, apply, reload}
}
