import * as React from 'react'
import {Slot} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

import {useHomeLayoutStore} from '../../source/features/home/store'

/// Streams, webcams and the two stations as tabs, for the tiled home, where
/// Streaming Media is one tile.
function StreamingTabs(): React.ReactNode {
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

/// A tiled home has one Streaming Media tile, so its screens tab between them;
/// the others open each from a tile of its own, and this route shows one at a
/// time, each titling the screen itself.
export default function StreamingMediaLayout(): React.ReactNode {
	let layout = useHomeLayoutStore((state) => state.layout)

	return layout === 'tiled' ? <StreamingTabs /> : <Slot />
}
