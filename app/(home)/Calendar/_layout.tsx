import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function CalendarLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="graduationcap.fill" />
				<NativeTabs.Trigger.Label>St. Olaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="northfield">
				<NativeTabs.Trigger.Icon sf="face.smiling.fill" />
				<NativeTabs.Trigger.Label>Northfield</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
