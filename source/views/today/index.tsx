import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {EventsWidget} from './widgets/events-widget'
import {HoursWidget} from './widgets/hours-widget'
import {BusWidget} from './widgets/bus-widget'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemGroupedBackground,
		paddingVertical: 8,
	},
})

function TodayView(): React.ReactNode {
	return (
		<ScrollView
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			testID="screen-today"
		>
			<EventsWidget />
			<HoursWidget />
			<BusWidget />
		</ScrollView>
	)
}

export {TodayView as View}

export const NavigationKey = 'Today'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Today',
	headerRight: (props) => <OpenSettingsButton {...props} />,
}
