import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {isDevMode} from '@frogpond/constants'
import {ServerUrlSection} from './server-url'
import {useNavigation} from '@react-navigation/native'
import {NavigationKey as DebugKey} from '../debug'
import {NavigationKey as ColorsInfoNavigationKey} from '../debug/colors'

export const DeveloperSection = (): React.ReactElement => {
	let navigation = useNavigation()

	const onAPIButton = () => navigation.navigate('APITest')
	const onColorsButton = () => navigation.navigate(ColorsInfoNavigationKey)
	const onBonAppButton = () => navigation.navigate('BonAppPicker')
	const onDebugButton = () => navigation.navigate(DebugKey, {keyPath: ['Root']})
	const onNetworkLoggerButton = () => navigation.navigate('NetworkLogger')
	const sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {level: 'info'})
		showSentryAlert()
	}
	const sendSentryException = () => {
		Sentry.captureException(new Error('Debug Exception'))
		showSentryAlert()
	}
	const showSentryAlert = () => {
		if (isDevMode()) {
			Alert.alert(
				'Sentry button pressed',
				'Nothing will appear in the dashboard during development.',
			)
		} else {
			Alert.alert(
				'Sent an event to Sentry.',
				'The dashboard should show a new event since this is not development.',
			)
		}
	}

	return (
		<>
			<Section header="DEVELOPER">
				<PushButtonCell onPress={onColorsButton} title="Colors Tester" />
				<PushButtonCell onPress={onAPIButton} title="API Tester" />
				<PushButtonCell onPress={onBonAppButton} title="Bon Appetit Picker" />
				<PushButtonCell onPress={onDebugButton} title="Debug" />
				<PushButtonCell
					onPress={onNetworkLoggerButton}
					title="Network Logger"
				/>
				<PushButtonCell
					onPress={sendSentryMessage}
					showLinkStyle={true}
					title="Send a Sentry Message"
				/>
				<PushButtonCell
					onPress={sendSentryException}
					showLinkStyle={true}
					title="Send a Sentry Exception"
				/>
			</Section>

			<ServerUrlSection />
		</>
	)
}
