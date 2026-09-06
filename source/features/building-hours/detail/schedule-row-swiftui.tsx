import * as React from 'react'
import type {ColorValue} from 'react-native'
import {HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	background,
	clipShape,
	font,
	foregroundStyle,
	frame,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'
import {formatBuildingTimes, summarizeDays} from '../lib'

/** The gap between the accent bar and the text beside it. */
const BAR_GAP = 8

/** How far the accent bar clears the title/subtitle block at each end. */
const BAR_OVERSHOOT = 3

type Props = {
	schedule: SingleBuildingScheduleType
	now: Moment
	isActive: boolean
	accentColor: ColorValue
}

/**
 * A single schedule row on the building detail screen: days on the left,
 * times on the right, with an accent bar and semibold text only when this
 * is the currently active (open) schedule.
 */
export function ScheduleRowSwiftUI({schedule, now, isActive, accentColor}: Props): React.ReactNode {
	let days = summarizeDays(schedule.days)
	let times = formatBuildingTimes(schedule, now)

	return (
		<HStack alignment="top" spacing={BAR_GAP}>
			{isActive ? (
				<VStack
					modifiers={[
						frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
						background(accentColor),
						clipShape('capsule'),
					]}
				>
					{null}
				</VStack>
			) : (
				<VStack modifiers={[frame({minWidth: 4, maxWidth: 4})]}>{null}</VStack>
			)}

			<HStack modifiers={[padding({vertical: BAR_OVERSHOOT})]}>
				<Text
					modifiers={[
						font({textStyle: 'body', weight: isActive ? 'semibold' : 'regular'}),
						foregroundStyle(c.label),
					]}
				>
					{days}
				</Text>
				<Spacer />
				<Text
					modifiers={[
						font({textStyle: 'body', weight: isActive ? 'semibold' : 'regular'}),
						foregroundStyle(c.secondaryLabel),
					]}
				>
					{times}
				</Text>
			</HStack>
		</HStack>
	)
}
