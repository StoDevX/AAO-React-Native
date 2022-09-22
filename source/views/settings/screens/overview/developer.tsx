import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {isDevMode} from '@frogpond/constants'
import {ServerUrlSection} from './server-url'
import {useNavigation} from '@react-navigation/native'

export const DeveloperSection = (): React.ReactElement => {
	let navigation = useNavigation()

	const onAPIButton = () => navigation.navigate('APITest')
	const onBonAppButton = () => navigation.navigate('BonAppPicker')
	const onDebugButton = () => navigation.navigate('Debug')
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
				<PushButtonCell onPress={onAPIButton} title="API Tester" />
				<PushButtonCell onPress={onBonAppButton} title="Bon Appetit Picker" />
				<PushButtonCell disabled={true} onPress={onDebugButton} title="Debug" />
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
