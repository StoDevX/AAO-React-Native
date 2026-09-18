import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {Stack, useSegments} from 'expo-router'

import {DAYS_OF_WEEK} from '../../../source/features/transportation/bus/components/days'
import {useBusDay} from '../../../source/features/transportation/bus/store'

export default function TransportationLayout(): React.ReactNode {
	let {selectedDay, setSelectedDay} = useBusDay()
	let segments = useSegments()

	// Other Modes lists boats and taxis, which keep no schedule, so a day
	// means nothing there.
	let isOtherModes = segments.at(-1) === 'other-modes'

	let label = DAYS_OF_WEEK.find(({day}) => day === selectedDay)?.label ?? 'Today'

	return (
		<>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu hidden={isOtherModes} title="Pick a schedule">
					<Stack.Toolbar.Icon sf="calendar" />
					<Stack.Toolbar.Label>{label}</Stack.Toolbar.Label>
					{DAYS_OF_WEEK.map(({day, label: dayLabel}) => (
						<Stack.Toolbar.MenuAction
							key={day}
							isOn={selectedDay === day}
							onPress={() => setSelectedDay(day)}
						>
							{dayLabel}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<NativeTabs>
				<NativeTabs.Trigger name="index">
					<NativeTabs.Trigger.Icon sf="bus.fill" />
					<NativeTabs.Trigger.Label>Express</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="red-line">
					<NativeTabs.Trigger.Icon sf="bus.fill" />
					<NativeTabs.Trigger.Label>Red Line</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="blue-line">
					<NativeTabs.Trigger.Icon sf="bus.fill" />
					<NativeTabs.Trigger.Label>Blue Line</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="oles-go">
					<NativeTabs.Trigger.Icon sf="car.fill" />
					<NativeTabs.Trigger.Label>Oles Go</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="other-modes">
					<NativeTabs.Trigger.Icon sf="sailboat.fill" />
					<NativeTabs.Trigger.Label>Other</NativeTabs.Trigger.Label>
				</NativeTabs.Trigger>
			</NativeTabs>
		</>
	)
}
