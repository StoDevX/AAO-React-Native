import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory, useRadioStore} from '../../source/features/streaming/radio'

export default function StreamingMediaLayout(): React.ReactNode {
	// While a station is loaded, the tab bar shows the mini-player.
	let radioLoaded = useRadioStore((state) => state.stationId !== null)

	return (
		// Minimising on a scroll down, as Music does, moves the mini-player
		// inline beside the shrunken tab bar.
		<NativeTabs minimizeBehavior="onScrollDown">
			{radioLoaded ? (
				<NativeTabs.BottomAccessory>
					<RadioTabAccessory />
				</NativeTabs.BottomAccessory>
			) : null}
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
