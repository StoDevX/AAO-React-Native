import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'
import {presentSurvey} from '@frogpond/researchkit-survey'
import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {ServerUrlSection} from './server-url'
import {ActionRow, NavigationRow} from '../../../../components/rows'

export const DeveloperSection = (): React.ReactElement => {
	let router = useRouter()
	const isDev = useIsDevMode()

	const onComponentsButton = () => router.push('/ComponentLibrary')
	const onAPIButton = () => router.push('/APITest')
	const onBonAppButton = () => router.push('/BonAppPicker')
	const onBannerBuilderButton = () => router.push('/BannerBuilder')
	const onDebugButton = () => router.push('/Debug')
	const onNetworkLoggerButton = () => router.push('/NetworkLogger')
	const sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {level: 'info'})
		showSentryAlert()
	}
	const sendSentryException = () => {
		Sentry.captureException(new Error('Debug Exception'))
		showSentryAlert()
	}
	const showSentryAlert = () => {
		if (isDev) {
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
	const testSurvey = async () => {
		try {
			const result = await presentSurvey({
				id: 'test-survey',
				title: 'Test Survey',
				instructions: 'Please answer a few questions to test the survey module.',
				questions: [
					{id: 'q1', type: 'boolean', title: 'Do you like this app?'},
					{
						id: 'q2',
						type: 'singleChoice',
						title: 'Favorite feature?',
						choices: [
							{value: 'dining', text: 'Dining'},
							{value: 'calendar', text: 'Calendar'},
							{value: 'directory', text: 'Directory'},
						],
					},
					{id: 'q3', type: 'scale', title: 'Rate your experience', min: 1, max: 5},
					{id: 'q4', type: 'text', title: 'Any feedback?', optional: true},
				],
			})
			Alert.alert('Survey Result', JSON.stringify(result, null, 2))
		} catch (error) {
			Alert.alert('Survey Error', String(error))
		}
	}

	return (
		<>
			<Section title="Developer">
				<NavigationRow onPress={onComponentsButton} title="Components" />
				<NavigationRow onPress={onAPIButton} title="API Tester" />
				<NavigationRow onPress={onBonAppButton} title="Bon Appetit Picker" />
				<NavigationRow onPress={onBannerBuilderButton} title="Banner Builder" />
				<NavigationRow onPress={onDebugButton} title="Debug" />
				<NavigationRow onPress={onNetworkLoggerButton} title="Network Logger" />
				<ActionRow onPress={sendSentryMessage} title="Send a Sentry Message" />
				<ActionRow onPress={sendSentryException} title="Send a Sentry Exception" />
				<ActionRow onPress={testSurvey} title="Test ResearchKit Survey" />
			</Section>

			<ServerUrlSection />
		</>
	)
}
