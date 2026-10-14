import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory} from '../../source/features/streaming/radio'
import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {requiresSection} from '../../source/features/campus/section-gate'

function StreamingMediaLayout(): React.ReactNode {
	// The mini-player is behind dev mode, so the accessory is left out without it.
	let isDev = useIsDevMode()
	return (
		// The radio's home, so the mini-player is always here, saying "Not
		// Playing" until a station starts; Home's switch hides only Home's.
		// Minimising on a scroll down, as Music does, moves it inline beside the
		// shrunken tab bar.
		<NativeTabs minimizeBehavior="onScrollDown">
			{isDev ? (
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
		</NativeTabs>
	)
}

export default requiresSection(
	'streaming',
	{title: 'Streaming Media', noun: 'webcams or streams', systemImage: 'video'},
	StreamingMediaLayout,
)
