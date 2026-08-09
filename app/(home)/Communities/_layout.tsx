import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function CommunitiesLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="person.2.fill" />
				<NativeTabs.Trigger.Label>r/stolaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="carleton">
				<NativeTabs.Trigger.Icon sf="building.columns.fill" />
				<NativeTabs.Trigger.Label>r/carletoncollege</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
