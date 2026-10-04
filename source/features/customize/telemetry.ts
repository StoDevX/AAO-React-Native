import * as Sentry from '@sentry/react-native'
import {getIcon} from 'react-native-change-icon'

import {type AppIconName, iconFor} from '../../../images/icons'
import * as storage from '../../lib/storage'
import {useRadioStore} from '../streaming/radio/store'
import {track} from '../telemetry/track'
import type {LinkTarget} from './open-links-in'

/// The Sentry tag naming the icon in use, so a crash or a report says which.
const ICON_TAG = 'app_icon'

/** Resolves once the radio's saved preferences have loaded, or failed to. */
function radioHydrated(): Promise<void> {
	if (useRadioStore.getState().hydrated) {
		return Promise.resolve()
	}
	return new Promise((resolve) => {
		let stop = useRadioStore.subscribe((state) => {
			if (state.hydrated) {
				stop()
				resolve()
			}
		})
	})
}

/**
 * Tags Sentry's scope with the icon iOS has set, and counts the launch with
 * how Customize is set up, once per JavaScript start. Never throws: telemetry
 * must not break the launch reporting it.
 */
export async function reportLaunch(): Promise<void> {
	try {
		let [systemIcon, inApp] = await Promise.all([
			getIcon(),
			storage.getInAppLinkPreference(),
			radioHydrated(),
		])
		let icon = iconFor(systemIcon)
		Sentry.setTag(ICON_TAG, icon)
		track({
			name: 'app.launch',
			attributes: {
				icon,
				links: inApp ? 'app' : 'safari',
				radio: useRadioStore.getState().showOnHome ? 'on' : 'off',
			},
		})
	} catch {
		// Nothing to report the failure to that is not this.
	}
}

/** Retags Sentry's scope with the icon just chosen, and counts the change. */
export function reportIconChange(icon: AppIconName): void {
	Sentry.setTag(ICON_TAG, icon)
	track({name: 'app_icon.change', attributes: {icon}})
}

/** Counts a new Open Links choice. */
export function reportLinkTargetChange(links: LinkTarget): void {
	track({name: 'open_links.change', attributes: {links}})
}

/** Counts turning Home's radio player on or off. */
export function reportRadioPlayerChange(shown: boolean): void {
	track({name: 'radio_player.change', attributes: {radio: shown ? 'on' : 'off'}})
}
