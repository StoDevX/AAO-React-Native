import * as React from 'react'
import {Button, Host, Image, Menu} from '@expo/ui/swift-ui'
import {accessibilityLabel, frame} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'

import {track} from '../../../telemetry/track'
import type {Station} from '../stations'
import {useRadioStore} from '../store'
import {palette} from './palette'

/** Full Schedule and Open Website, behind the title's ••• button. */
export function StationMenu({station}: {station: Station}): React.ReactNode {
	let openFullSchedule = useRadioStore((state) => state.openFullSchedule)
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
						// Stacked over the sheet, as the website is: a screen opened
						// beneath the sheet could not be seen without closing it.
						track({
							name: 'radio.action',
							attributes: {action: 'full_schedule', station: station.id},
						})
						openFullSchedule()
					}}
					systemImage="calendar"
				/>
				<Button
					label="Open Website"
					onPress={() => {
						track({name: 'radio.action', attributes: {action: 'website', station: station.id}})
						openUrl(station.playerUrl)
					}}
					systemImage="safari"
				/>
			</Menu>
		</Host>
	)
}
