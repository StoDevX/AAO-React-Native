import * as React from 'react'
import {NativeTabs} from 'expo-router/native-tabs'
import {RadioTabAccessory} from './radio'
import {useOfferedStations} from './radio/station-flags'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

/** Streams and webcams as native tabs, with the radio's mini-player beneath in dev mode. */
export function StreamingMediaTabs(): React.ReactNode {
	// The mini-player is behind dev mode, so the accessory is left out without it.
	let isDev = useIsDevMode()
	let anyStationOn = useOfferedStations().length > 0
	return (
		// The radio's home, so the mini-player is always here, saying "Not
		// Playing" until a station starts; Home's switch hides only Home's.
		// Minimising on a scroll down, as Music does, moves it inline beside the
		// shrunken tab bar.
		<NativeTabs minimizeBehavior="onScrollDown">
			{isDev && anyStationOn ? (
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
