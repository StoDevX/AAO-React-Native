import * as React from 'react'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {RadioTabAccessory, useRadioStore} from '../../source/features/streaming/radio'

import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'

export default function MenusLayout(): React.ReactNode {
	// While a station is loaded, the tab bar shows the mini-player.
	let radioLoaded = useRadioStore((state) => state.stationId !== null)

	return (
		// The host sits here rather than in each tab: Expo Router keys a
		// screen's header options by the nearest route, and inside a tab that
		// is the tab's own -- the stack above never sees them.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			{/* Only a playing radio's mini-player is worth the room a shrinking
			    tab bar makes; with none, the bar stays put. Minimising moves the
			    mini-player inline beside the shrunken bar. */}
			<NativeTabs minimizeBehavior={radioLoaded ? 'onScrollDown' : 'never'}>
				{radioLoaded ? (
					<NativeTabs.BottomAccessory>
						<RadioTabAccessory />
					</NativeTabs.BottomAccessory>
				) : null}
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
		</MenuHeaderProvider>
	)
}
