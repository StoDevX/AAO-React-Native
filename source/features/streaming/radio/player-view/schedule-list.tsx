import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {formatCompactTime} from '@frogpond/time-format'

import type {Station} from '../stations'
import {useStationSchedule} from '../use-station-schedule'

/** The rest of today's shows, or why there are none. Few enough rows not to need a list. */
export function ScheduleList({station}: {station: Station}): React.ReactNode {
	let {upcoming, status} = useStationSchedule(station.id)
	if (status === 'error') {
		return <Text style={styles.note}>Couldn’t load the schedule</Text>
	}
	if (status === 'ready' && upcoming.length === 0) {
		return <Text style={styles.note}>Nothing else today</Text>
	}
	return (
		<View accessibilityLabel="Today's schedule" style={styles.list}>
			{upcoming.map((show) => (
				<View key={`${show.startTime.valueOf()}|${show.title}`} style={styles.row}>
					<Text style={styles.time}>{formatCompactTime(show.startTime)}</Text>
					<Text numberOfLines={1} style={styles.title}>
						{show.title}
					</Text>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	list: {gap: 12},
	row: {flexDirection: 'row', gap: 12},
	time: {color: c.secondaryLabel, fontSize: 17, width: 80},
	title: {color: c.label, fontSize: 17, flex: 1},
	note: {color: c.secondaryLabel, fontSize: 17, textAlign: 'center'},
})
