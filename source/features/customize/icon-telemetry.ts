import * as Sentry from '@sentry/react-native'
import {getIcon} from 'react-native-change-icon'

import {type AppIconName, iconFor} from '../../../images/icons'
import {track} from '../telemetry/track'

/// The Sentry tag naming the icon in use, so a crash or a report says which.
const ICON_TAG = 'app_icon'

/**
 * Tags Sentry's scope with the icon iOS has set and counts the launch, once
 * per JavaScript start. Never throws: an unreadable icon costs a tag, not the
 * launch.
 */
export async function reportIconAtLaunch(): Promise<void> {
	try {
		let icon = iconFor(await getIcon())
		Sentry.setTag(ICON_TAG, icon)
		track({name: 'app.launch', attributes: {icon}})
	} catch {
		// Nothing to report the failure to that is not this.
	}
}

/** Retags Sentry's scope with the icon just chosen, and counts the change. */
export function reportIconChange(icon: AppIconName): void {
	Sentry.setTag(ICON_TAG, icon)
	track({name: 'app_icon.change', attributes: {icon}})
}
