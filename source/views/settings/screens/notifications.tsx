import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Section, TableView} from '@frogpond/tableview'
import {CellToggle} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {useNotificationPreferences} from '../../../lib/notification-preferences'
import {
	hasNotificationPermission,
	requestNotificationPermission,
} from '../../../lib/notifications'
import {
	registerBackgroundTaskAsync,
	unregisterBackgroundTaskAsync,
} from '../../../lib/background-task'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
	},
	content: {
		paddingVertical: 20,
	},
})

type Feature = {
	id: string
	label: string
	detail: string
}

const FEATURES: Feature[] = [
	{
		id: 'menus',
		label: 'Dining Menus',
		detail: 'Get notified when daily menus are updated',
	},
	{
		id: 'calendar',
		label: 'Calendar',
		detail: 'Get notified about upcoming campus events',
	},
	{
		id: 'news',
		label: 'News',
		detail: 'Get notified about new campus news articles',
	},
]

export const NotificationsView = (): React.ReactNode => {
	const {enabled, features, setEnabled, setFeatureEnabled} =
		useNotificationPreferences()

	const handleMasterToggle = async (value: boolean) => {
		if (value) {
			const granted = await requestNotificationPermission()
			if (!granted) {
				return
			}
			await registerBackgroundTaskAsync()
		} else {
			await unregisterBackgroundTaskAsync()
		}
		setEnabled(value)
	}

	const handleFeatureToggle = async (featureId: string, value: boolean) => {
		setFeatureEnabled(featureId, value)

		// If the user enables a feature but the master toggle is off, turn it on
		// (requesting permission first).
		if (value && !enabled) {
			const alreadyGranted = await hasNotificationPermission()
			if (alreadyGranted) {
				await registerBackgroundTaskAsync()
				setEnabled(true)
			}
		}
	}

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior="automatic"
			style={styles.container}
		>
			<TableView>
				<Section
					footer="When off, no notifications will be delivered regardless of feature settings."
					header="NOTIFICATIONS"
				>
					<CellToggle
						label="Enable Notifications"
						onChange={handleMasterToggle}
						value={enabled}
					/>
				</Section>

				<Section
					footer="Choose which features can send you notifications in the background."
					header="FEATURES"
				>
					{FEATURES.map((feature) => (
						<CellToggle
							key={feature.id}
							detail={feature.detail}
							disabled={!enabled}
							label={feature.label}
							onChange={(value) => handleFeatureToggle(feature.id, value)}
							value={features[feature.id] ?? false}
						/>
					))}
				</Section>
			</TableView>
		</ScrollView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Notifications',
}
