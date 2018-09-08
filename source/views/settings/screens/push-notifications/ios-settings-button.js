// @flow

import * as React from 'react'
import {Linking} from 'react-native'
import {appName} from '@frogpond/constants'
import {Section, PushButtonCell} from '@frogpond/tableview'

type Props = {
	pushesEnabled: boolean,
	hasPrompted: boolean,
	onEnable: () => any,
}

export function IosNotificationSettingsButton(props: Props) {
	let {pushesEnabled, hasPrompted, onEnable} = props

	let offString = `Notifications are turned off for "${appName()}".`
	let onString = `Notifications are turned on for "${appName()}".`

	let titleText: string
	let footerText: string
	let onPress: () => any

	if (pushesEnabled) {
		// we have seen the prompt and given permission
		// -- show a button to open settings to turn off notifications
		titleText = 'Disable Notifications'
		footerText = `${onString}. You can turn notifications off for this app in Settings.`
		onPress = () => Linking.openURL('app-settings:')
	} else {
		if (hasPrompted) {
			// we declined the initial prompt
			// -- show a button to open settings to turn on notifications
			titleText = 'Open Settings'
			footerText = `${offString} You can turn notifications on for this app in Settings.`
			onPress = () => Linking.openURL('app-settings:')
		} else {
			// we have not been prompted before
			// -- let onesignal prompt for permissions
			titleText = 'Enable Notifications'
			footerText = `${offString}. You can turn notifications on for this app by pushing the button above.`
			onPress = onEnable
		}
	}

	return (
		<Section footer={footerText} header="NOTIFICATION SETTINGS">
			<PushButtonCell onPress={onPress} title={titleText} />
		</Section>
	)
}
