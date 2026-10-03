import * as React from 'react'
import {Slot} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory} from '../../source/features/streaming/radio'

import {useHomeLayoutStore} from '../../source/features/home/store'

/// Streams and webcams as tabs, for the tiled home, where Streaming Media is
/// one tile.
function StreamingTabs(): React.ReactNode {
	return (
		// The radio's home, so the mini-player is always here, saying "Not
		// Playing" until a station starts; Home's switch hides only Home's.
		// Minimising on a scroll down, as Music does, moves it inline beside the
		// shrunken tab bar.
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
		</NativeTabs>
	)
}

/// A tiled home has one Streaming Media tile, so its screens tab between them;
/// the others open each from a tile of its own, and this route shows one at a
/// time, each titling the screen itself. The radio's mini-player is a tab
/// accessory, so only the tabs carry it.
export default function StreamingMediaLayout(): React.ReactNode {
	let layout = useHomeLayoutStore((state) => state.layout)

	return layout === 'tiled' ? <StreamingTabs /> : <Slot />
}
