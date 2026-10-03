import * as React from 'react'
import {usePathname} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory, useRadioBarVisible} from '../../source/features/streaming/radio'

export default function StreamingMediaLayout(): React.ReactNode {
	// The mini-player shows while a station is loaded or the Home switch asks
	// for it, but never over the Radio tab, which is the player itself.
	let barVisible = useRadioBarVisible()
	let onRadioTab = usePathname() === '/streaming-media/radio'
	let accessory = barVisible && !onRadioTab

	return (
		// Minimising on a scroll down, as Music does, moves the mini-player
		// inline beside the shrunken tab bar.
		<NativeTabs minimizeBehavior={accessory ? 'onScrollDown' : 'never'}>
			{accessory ? (
				<NativeTabs.BottomAccessory>
					<RadioTabAccessory showWhenIdle={true} />
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
			{/* The tab sizes its player to the room between the bars itself. */}
			<NativeTabs.Trigger disableAutomaticContentInsets={true} name="radio">
				<NativeTabs.Trigger.Icon sf="radio.fill" />
				<NativeTabs.Trigger.Label>Radio</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	)
}
