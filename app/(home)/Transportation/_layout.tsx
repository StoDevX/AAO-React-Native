import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function TransportationLayout(): React.ReactNode {
	return (
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
	)
}
