import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section, PushButtonCell} from '@frogpond/tableview'
import type {NavigationScreenProp} from 'react-navigation'
import {isDevMode} from '@frogpond/constants'
import {ServerUrlSection} from './server-url'

type Props = {
	navigation: NavigationScreenProp<any>
}

export const DeveloperSection = ({navigation}: Props): React.ReactElement => {
	const onAPIButton = () => navigation.navigate('APITestView')
	const onBonAppButton = () => navigation.navigate('BonAppPickerView')
	const onDebugButton = () => navigation.navigate('DebugView')
	const sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {level: Sentry.Severity.Info})
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
			Sentry.setEventSentSuccessfully((event) => {
				Alert.alert(`Sent an event to Sentry: ${event.event_id}`)
			})
		}
	}

	return (
		<>
			<Section header="DEVELOPER">
				<PushButtonCell onPress={onAPIButton} title="API Tester" />
				<PushButtonCell onPress={onBonAppButton} title="Bon Appetit Picker" />
				<PushButtonCell onPress={onDebugButton} title="Debug" />
				<PushButtonCell
					onPress={sendSentryMessage}
					title="Send a Sentry Message"
				/>
				<PushButtonCell
					onPress={sendSentryException}
					title="Send a Sentry Exception"
				/>
			</Section>

			<ServerUrlSection />
		</>
	)
}
