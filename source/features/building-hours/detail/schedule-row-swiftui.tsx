import * as React from 'react'
import type {ColorValue} from 'react-native'
import {HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {background, clipShape, font, foregroundStyle, frame} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {formatBuildingTimes, summarizeDays} from '../lib'

/** The gap between the accent bar and the text beside it. */
const BAR_GAP = 8

type ScheduleEntry = {
	schedule: SingleBuildingScheduleType
	isActive: boolean
}

type Props = {
	entries: ScheduleEntry[]
	now: Moment
	accentColor: ColorValue
}

/**
 * A grouped schedule row: day label on the left, time entries stacked on the right.
 * The accent bar appears to the left of the day label when any entry is active.
 */
export function ScheduleRowSwiftUI({entries, now, accentColor}: Props): React.ReactNode {
	if (entries.length === 0) return null

	let days = summarizeDays(entries[0].schedule.days)
	let hasActiveEntry = entries.some((e) => e.isActive)

	return (
		<HStack alignment="top" spacing={BAR_GAP}>
			<VStack
				modifiers={[
					frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
					...(hasActiveEntry ? [background(accentColor), clipShape('capsule')] : []),
				]}
			>
				{null}
			</VStack>
			<Text
				modifiers={[
					font({textStyle: 'body', weight: hasActiveEntry ? 'semibold' : 'regular'}),
					foregroundStyle(c.label),
				]}
			>
				{days}
			</Text>
			<Spacer />
			<VStack alignment="leading" spacing={2}>
				{entries.map(({schedule, isActive}) => (
					<Text
						key={`${schedule.from}-${schedule.to}`}
						modifiers={[
							font({textStyle: 'body', weight: isActive ? 'semibold' : 'regular'}),
							foregroundStyle(c.secondaryLabel),
						]}
					>
						{formatBuildingTimes(schedule, now)}
					</Text>
				))}
			</VStack>
		</HStack>
	)
}
