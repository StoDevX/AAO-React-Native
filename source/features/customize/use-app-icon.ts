import * as React from 'react'
import {changeIcon, getIcon, resetIcon} from 'react-native-change-icon'
import {type AppIconName, DEFAULT_ICON, iconFor} from '../../../images/icons'
import type {Campus} from '../campus/store'
import {reportIconChange} from './telemetry'
import {type IconEntry, currentIconEntry, iconForCampus} from './icons'

/** Sets the app icon to `type`, through the call iOS wants for the primary. */
async function setIcon(type: AppIconName): Promise<void> {
	if (type === DEFAULT_ICON) {
		await resetIcon()
	} else {
		await changeIcon(type)
	}
	reportIconChange(type)
}

/** The campus icon change under way, which the next one waits for. */
let pendingIconSwitch: Promise<void> = Promise.resolve()

/**
 * Moves the app icon to `campus`'s own when it wears the other campus's. iOS
 * may refuse, and then the icon simply stays; the gallery still offers the
 * campus's own. Each change waits for the one before it, so switching campus
 * twice in quick succession reads the icon the first change left and ends on
 * the campus chosen last.
 */
export function switchIconForCampus(campus: Campus): Promise<void> {
	pendingIconSwitch = pendingIconSwitch.then(async () => {
		try {
			let next = iconForCampus(iconFor(await getIcon()), campus)
			if (next) {
				await setIcon(next)
			}
		} catch {
			// iOS refused the change, or cannot change icons at all.
		}
	})
	return pendingIconSwitch
}

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
				await setIcon(type)
			} catch {
				// iOS refused the change; the reload below shows the icon it kept.
			}
			await reload()
		},
		[current.type, reload],
	)

	return {current, apply, reload}
}
