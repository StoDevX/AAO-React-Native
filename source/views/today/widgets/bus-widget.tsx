import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {useQuery} from '@tanstack/react-query'
import {useNavigation} from '@react-navigation/native'

import * as c from '@frogpond/colors'
import {useMomentTimer} from '@frogpond/timer'
import {WidgetCard, widgetStyles} from '../widget-card'
import {busRoutesOptions} from '../../transportation/bus/query'
import {selectNextDepartures} from '../lib'

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	line: {fontSize: 16, color: c.label, flex: 1},
	time: {fontSize: 14, color: c.secondaryLabel, marginLeft: 8},
})

export const BusWidget = React.memo(function BusWidget(): React.ReactNode {
	let navigation = useNavigation()
	let {now} = useMomentTimer({intervalMs: 60000})
	let {data = []} = useQuery(busRoutesOptions)
	let departures = selectNextDepartures(data, now)

	return (
		<WidgetCard
			actionLabel="See all"
			onPressAction={() => navigation.navigate('Transportation')}
			title="Next Buses"
		>
			{departures.length === 0 ? (
				<Text style={widgetStyles.empty}>No bus schedules available.</Text>
			) : (
				departures.map((d) => (
					<View key={d.line} style={styles.row}>
						<Text numberOfLines={1} style={styles.line}>
							{d.line}
						</Text>
						<Text style={styles.time}>
							{d.time ? d.time.format('h:mm a') : 'Not running'}
						</Text>
					</View>
				))
			)}
		</WidgetCard>
	)
})
