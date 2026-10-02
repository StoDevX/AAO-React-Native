import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory} from '../../source/features/streaming/radio'

export default function StreamingMediaLayout(): React.ReactNode {
	return (
		// The radio's home, so the mini-player is always here, saying "Not
		// Playing" until a station starts. Minimising on a scroll down, as Music
		// does, moves it inline beside the shrunken tab bar.
		<NativeTabs minimizeBehavior="onScrollDown">
			<NativeTabs.BottomAccessory>
				<RadioTabAccessory showWhenIdle={true} />
			</NativeTabs.BottomAccessory>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon sf="recordingtape" />
				<NativeTabs.Trigger.Label>Streaming</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="webcams">
				<NativeTabs.Trigger.Icon sf="web.camera.fill" />
				<NativeTabs.Trigger.Label>Webcams</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="radio">
				<NativeTabs.Trigger.Icon sf="radio.fill" />
				<NativeTabs.Trigger.Label>Radio</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
