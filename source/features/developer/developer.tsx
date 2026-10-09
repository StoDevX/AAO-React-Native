import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert} from 'react-native'
import {Section} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

import {CAMPUSES} from '../../campuses'
import {useIsDevMode} from '../../lib/use-is-dev-mode'
import {ServerUrlSection} from './server-url'
import {DebugSwiftSection} from './debugswift-section'
import {ActionRow, NavigationRow} from '../../components/rows'
import {refreshApp} from '../../lib/refresh'

const onResetButton = () => {
	Alert.alert('Reset Everything', 'Are you sure you want to clear everything?', [
		{text: 'Nope!', style: 'cancel'},
		{
			text: 'Reset it!',
			style: 'destructive',
			onPress: () => refreshApp(),
		},
	])
}

export const DeveloperSection = (): React.ReactElement => {
	let router = useRouter()
	const isDev = useIsDevMode()

	const onComponentsButton = () => router.navigate('/developer/component-library')
	const onAPIButton = () => router.navigate('/developer/api-test')
	const onBonAppButton = () => router.navigate('/developer/bon-app-picker')
	const onBannerBuilderButton = () => router.navigate('/developer/banner-builder')
	const onDebugButton = () => router.navigate('/developer/debug')
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
			<Section>
				<ActionRow onPress={onResetButton} title="Reset Everything" />
				<NavigationRow onPress={onComponentsButton} title="Components" />
				<NavigationRow onPress={onAPIButton} title="API Tester" />
				<NavigationRow onPress={onBonAppButton} title="Bon Appetit Picker" />
				<NavigationRow onPress={onBannerBuilderButton} title="Banner Builder" />
				<NavigationRow onPress={onDebugButton} title="Debug" />
				<ActionRow onPress={sendSentryMessage} title="Send a Sentry Message" />
				<ActionRow onPress={sendSentryException} title="Send a Sentry Exception" />
			</Section>

			<DebugSwiftSection />

			{CAMPUSES.map((campus) => (
				<ServerUrlSection key={campus.id} campus={campus} />
			))}
		</>
	)
}
