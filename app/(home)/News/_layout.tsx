import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function NewsLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="graduationcap.fill" />
				<NativeTabs.Trigger.Label>St. Olaf</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="mess">
				<NativeTabs.Trigger.Icon sf="newspaper.fill" />
				<NativeTabs.Trigger.Label>The Mess</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
