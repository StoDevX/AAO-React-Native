import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import type {EventType} from '@frogpond/event-type'

import type {Station} from '../stations'
import type {ScheduleStatus} from './schedule-note'
import {showTitleText} from './show-title-text'
import {palette} from './palette'

export function ShowTitle({
	station,
	current,
	status,
}: {
	station: Station
	current: EventType | null
	status: ScheduleStatus
}): React.ReactNode {
	let {title, subtitle} = showTitleText(station, current, status)
	return (
		<View style={styles.block}>
			<Text numberOfLines={1} style={[styles.title, palette.styles.primary]}>
				{title}
			</Text>
			<Text numberOfLines={1} style={[styles.subtitle, palette.styles.secondary]}>
				{subtitle}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	block: {flex: 1},
	title: {fontSize: 22, fontWeight: '600'},
	subtitle: {fontSize: 20, fontVariant: ['tabular-nums']},
})
