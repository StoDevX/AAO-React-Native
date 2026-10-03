import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import {formatCompactTime} from '@frogpond/time-format'

import {palette} from './palette'
import {scheduleNote, type ScheduleStatus} from './schedule-note'

/** The rest of today's shows, or why there are none. Few enough rows not to need a list. */
export function ScheduleList({
	upcoming,
	status,
}: {
	upcoming: readonly EventType[]
	status: ScheduleStatus
}): React.ReactNode {
	let note = scheduleNote(status, upcoming.length)
	if (note) {
		return <Text style={[styles.note, palette.styles.secondary]}>{note}</Text>
	}
	return (
		<View style={styles.list}>
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
