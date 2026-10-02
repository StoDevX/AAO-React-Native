import * as React from 'react'
import {Slot} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'

import {MenuHeaderHost, MenuHeaderProvider} from '../../source/features/menus/menu-header'
import {useHomeLayoutStore} from '../../source/features/home/store'

/// The cafes as tabs, for the tiled home, where Menus is one tile.
function CafeTabs(): React.ReactNode {
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

export default function MenusLayout(): React.ReactNode {
	let layout = useHomeLayoutStore((state) => state.layout)

	return (
		// A tiled home has one Menus tile, so the cafes tab between them; the
		// others open each cafe from a tile of its own, and this route shows one
		// at a time. The host sits here rather than in each cafe: Expo Router
		// keys a screen's header options by the nearest stack route, which is
		// this one.
		<MenuHeaderProvider>
			<MenuHeaderHost />
			{layout === 'tiled' ? <CafeTabs /> : <Slot />}
		</MenuHeaderProvider>
	)
}
