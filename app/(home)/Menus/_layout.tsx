import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function MenusLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="fork.knife" />
				<NativeTabs.Trigger.Label>Stav Hall</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="the-cage">
				<NativeTabs.Trigger.Icon sf="cup.and.saucer.fill" />
				<NativeTabs.Trigger.Label>The Cage</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="the-pause">
				<NativeTabs.Trigger.Icon sf="pawprint.fill" />
				<NativeTabs.Trigger.Label>The Pause</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="carleton">
				<NativeTabs.Trigger.Icon sf="list.bullet" />
				<NativeTabs.Trigger.Label>Carleton</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
