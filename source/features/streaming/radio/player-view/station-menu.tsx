import * as React from 'react'
import {Button, Host, Image, Menu} from '@expo/ui/swift-ui'
import {accessibilityLabel, frame} from '@expo/ui/swift-ui/modifiers'
import {useRouter} from 'expo-router'
import {openUrl} from '@frogpond/open-url'

import type {Station} from '../stations'
import {useRadioStore} from '../store'
import {usePalette} from './palette'

/** Full Schedule and Open Website, behind the title's ••• button. */
export function StationMenu({station}: {station: Station}): React.ReactNode {
	let router = useRouter()
	let palette = usePalette()
	let closeSheet = useRadioStore((state) => state.closeSheet)
	return (
		<Host matchContents={true}>
			<Menu
				label={<Image color={palette.primary} systemName="ellipsis" />}
				modifiers={[
					accessibilityLabel(`More for ${station.stationName}`),
					frame({width: 44, height: 44}),
				]}
			>
				<Button
					label="Full Schedule"
					onPress={() => {
						// The sheet sits above every screen, so it has to go before the
						// schedule can be seen. On the Radio tab it is already closed.
						closeSheet()
						router.navigate(station.scheduleHref)
					}}
					systemImage="calendar"
				/>
				<Button
					label="Open Website"
					onPress={() => openUrl(station.playerUrl)}
					systemImage="safari"
				/>
			</Menu>
		</Host>
	)
}
