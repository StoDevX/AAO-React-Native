import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

import type {Station} from '../stations'
import {useStationSchedule} from '../use-station-schedule'
import {showTitleText} from './show-title-text'

export function ShowTitle({station}: {station: Station}): React.ReactNode {
	let {current} = useStationSchedule(station.id)
	let {title, subtitle} = showTitleText(station, current)
	return (
		<View style={styles.block}>
			<Text numberOfLines={1} style={styles.title}>
				{title}
			</Text>
			<Text numberOfLines={1} style={styles.subtitle}>
				{subtitle}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	block: {flex: 1},
	title: {color: c.label, fontSize: 22, fontWeight: '600'},
	subtitle: {color: c.secondaryLabel, fontSize: 20},
})
