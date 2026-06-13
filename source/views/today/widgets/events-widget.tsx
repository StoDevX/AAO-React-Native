import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import {useNavigation} from '@react-navigation/native'

import * as c from '@frogpond/colors'
import {namedCalendarOptions} from '@frogpond/ccc-calendar'
import {useMomentTimer} from '@frogpond/timer'
import {Touchable} from '@frogpond/touchable'
import {WidgetCard, widgetStyles} from '../widget-card'
import {selectTodaysEvents} from '../lib'

const POWERED_BY = {
	title: 'Powered by the St. Olaf calendar',
	href: 'https://wp.stolaf.edu/calendar/',
}

const styles = StyleSheet.create({
	row: {paddingVertical: 6},
	time: {fontSize: 13, color: c.secondaryLabel},
	title: {fontSize: 16, color: c.label},
})

export const EventsWidget = React.memo(
	function EventsWidget(): React.ReactNode {
		let navigation = useNavigation()
		let {now} = useMomentTimer({intervalMs: 60000})
		let {data = []} = useQuery(namedCalendarOptions('stolaf'))
		let events = selectTodaysEvents(data, now)

		return (
			<WidgetCard
				actionLabel="See all"
				onPressAction={() => navigation.navigate('Calendar')}
				title="Today's Events"
			>
				{events.length === 0 ? (
					<Text style={widgetStyles.empty}>
						Nothing left on the calendar today.
					</Text>
				) : (
					events.map((event, i) => (
						<Touchable
							key={`${event.title}-${i}`}
							accessibilityLabel={event.title}
							accessibilityRole="button"
							highlight={false}
							onPress={() =>
								navigation.navigate('EventDetail', {
									event,
									poweredBy: POWERED_BY,
								})
							}
							style={styles.row}
						>
							<View>
								<Text style={styles.time}>
									{event.startTime.format('h:mm a')}
								</Text>
								<Text numberOfLines={1} style={styles.title}>
									{event.title}
								</Text>
							</View>
						</Touchable>
					))
				)}
			</WidgetCard>
		)
	},
)
