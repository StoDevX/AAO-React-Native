import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {formatCompactTime} from '@frogpond/time-format'

import type {Station} from '../stations'
import {useStationSchedule} from '../use-station-schedule'
import {usePalette} from './palette'

/** The rest of today's shows, or why there are none. Few enough rows not to need a list. */
export function ScheduleList({station}: {station: Station}): React.ReactNode {
	let {upcoming, status} = useStationSchedule(station.id)
	let palette = usePalette()
	if (status === 'error') {
		return <Text style={[styles.note, palette.styles.secondary]}>Couldn’t load the schedule</Text>
	}
	if (status === 'ready' && upcoming.length === 0) {
		return <Text style={[styles.note, palette.styles.secondary]}>Nothing else today</Text>
	}
	return (
		<View accessibilityLabel="Today's schedule" style={styles.list}>
			{upcoming.map((show) => (
				<View key={`${show.startTime.valueOf()}|${show.title}`} style={styles.row}>
					<Text style={[styles.time, palette.styles.secondary]}>
						{formatCompactTime(show.startTime)}
					</Text>
					<Text numberOfLines={1} style={[styles.title, palette.styles.primary]}>
						{show.title}
					</Text>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	list: {alignSelf: 'stretch', gap: 12},
	row: {flexDirection: 'row', gap: 12},
	time: {fontSize: 17, width: 80},
	title: {fontSize: 17, flex: 1},
	note: {fontSize: 17, textAlign: 'center'},
})
