import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function SISLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="creditcard.rewards.fill" />
				<NativeTabs.Trigger.Label>Balances</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="student-work">
				<NativeTabs.Trigger.Icon sf="briefcase.fill" />
				<NativeTabs.Trigger.Label>Open Jobs</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
