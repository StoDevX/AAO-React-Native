/**
 * <ScheduleRow/> renders a single row of the schedule information.
 */

import * as React from 'react'
import {View, Text, StyleSheet, StyleProp, TextStyle} from 'react-native'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {formatBuildingTimes, summarizeDays} from '../lib'

interface Props {
	set: SingleBuildingScheduleType
	isActive: boolean
	now: Moment
}

export const ScheduleRow = (props: Props): React.JSX.Element => {
	let {set, isActive, now} = props
	return (
		<View style={styles.scheduleRow}>
			<StyledText style={[styles.scheduleDays, isActive && styles.bold]}>
				{summarizeDays(set.days)}
			</StyledText>

			<StyledText style={[styles.scheduleHours, isActive && styles.bold]}>
				{formatBuildingTimes(set, now)}
			</StyledText>
		</View>
	)
}

interface StyledTextProps {
	children: Text['props']['children']
	style: StyleProp<TextStyle>
}

const StyledText = ({children, style}: StyledTextProps) => (
	<Text numberOfLines={1} selectable={true} style={style}>
		{children}
	</Text>
)

const styles = StyleSheet.create({
	bold: {
		fontWeight: 'bold',
	},
	scheduleRow: {
		flexDirection: 'row',
		paddingVertical: 6,
	},
	scheduleDays: {
		flex: 1,
		textAlign: 'right',
		paddingRight: 16,
	},
	scheduleHours: {
		flex: 2,
	},
})
