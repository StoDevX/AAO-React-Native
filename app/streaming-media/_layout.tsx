import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

export default function StreamingMediaLayout(): React.ReactNode {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="recordingtape" />
				<NativeTabs.Trigger.Label>Streaming</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="webcams">
				<NativeTabs.Trigger.Icon sf="web.camera.fill" />
				<NativeTabs.Trigger.Label>Webcams</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="ksto">
				<NativeTabs.Trigger.Icon sf="radio.fill" />
				<NativeTabs.Trigger.Label>KSTO</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="krlx">
				<NativeTabs.Trigger.Icon sf="mic.fill" />
				<NativeTabs.Trigger.Label>KRLX</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
