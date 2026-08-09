import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'
import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {ServerUrlSection} from './server-url'
import {ActionRow, NavigationRow} from '../../components/rows'

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
				<ActionRow
					onPress={sendSentryException}
					title="Send a Sentry Exception"
				/>
			</Section>

			<ServerUrlSection />
		</>
	)
}
