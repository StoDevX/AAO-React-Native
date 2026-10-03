import * as React from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import {formatCompactTime} from '@frogpond/time-format'

import {palette} from './palette'
import {scheduleNote, type ScheduleStatus} from './schedule-note'

const ScheduleRow = React.memo(function ScheduleRow({show}: {show: EventType}): React.ReactNode {
	return (
		<View style={styles.row}>
			<Text style={[styles.time, palette.styles.secondary]}>
				{formatCompactTime(show.startTime)}
			</Text>
			<Text numberOfLines={1} style={[styles.title, palette.styles.primary]}>
				{show.title}
			</Text>
		</View>
	)
})

function showKey(show: EventType): string {
	return `${show.startTime.valueOf()}|${show.title}`
}

function renderShow({item}: {item: EventType}): React.ReactElement {
	return <ScheduleRow show={item} />
}

/**
 * The rest of today's shows, or why there are none. It fills the record's
 * place and scrolls, as a day can hold more shows than the record is tall.
 */
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
		<FlatList
			contentContainerStyle={styles.content}
			data={upcoming}
			keyExtractor={showKey}
			renderItem={renderShow}
			style={styles.list}
			testID="radio-schedule-list"
		/>
	)
}

const styles = StyleSheet.create({
	// The record's place has a fixed height, so the list takes it and scrolls
	// within it rather than growing past it.
	list: {alignSelf: 'stretch', flex: 1},
	content: {gap: 12},
	row: {flexDirection: 'row', gap: 12},
	time: {fontSize: 17, width: 80},
	title: {fontSize: 17, flex: 1},
	note: {fontSize: 17, textAlign: 'center'},
})
