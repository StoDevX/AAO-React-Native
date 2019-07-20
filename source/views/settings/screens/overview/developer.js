// @flow
import {Sentry, SentrySeverity} from 'react-native-sentry'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {type NavigationScreenProp} from 'react-navigation'
import {isDevMode} from '@frogpond/constants'

type Props = {navigation: NavigationScreenProp<*>}

export class DeveloperSection extends React.Component<Props> {
	onAPIButton = () => this.props.navigation.navigate('APITestView')
	onBonAppButton = () => this.props.navigation.navigate('BonAppPickerView')
	onDebugButton = () => this.props.navigation.navigate('DebugView')
	sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {
			level: SentrySeverity.Info,
		})
		this.showSentryAlert()
	}
	sendSentryException = () => {
		Sentry.captureException(new Error('Debug Exception'))
		this.showSentryAlert()
	}
	showSentryAlert = () => {
		if (isDevMode()) {
			Alert.alert(
				'Sentry button pressed',
				'Nothing will appear in the dashboard during development.',
			)
		} else {
			Sentry.setEventSentSuccessfully(event => {
				Alert.alert(`Sent an event to Sentry: ${event.event_id}`)
			})
		}
	}

	render() {
		return (
			<Section header="DEVELOPER">
				<PushButtonCell onPress={this.onAPIButton} title="API Tester" />
				<PushButtonCell
					onPress={this.onBonAppButton}
					title="Bon Appetit Picker"
				/>
				<PushButtonCell onPress={this.onDebugButton} title="Debug" />
				<PushButtonCell
					onPress={this.sendSentryMessage}
					title="Send a Sentry Message"
				/>
				<PushButtonCell
					onPress={this.sendSentryException}
					title="Send a Sentry Exception"
				/>
			</Section>
		)
	}
}
