import * as React from 'react'
import {NativeTabs} from 'expo-router/native-tabs'

/** Upcoming and archived convocations as native tabs. */
export function ConvocationTabs(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="calendar" />
				<NativeTabs.Trigger.Label>Upcoming</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="archived">
				<NativeTabs.Trigger.Icon sf="waveform" />
				<NativeTabs.Trigger.Label>Archives</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
