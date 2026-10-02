import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {Button, Host, Image, Menu} from '@expo/ui/swift-ui'
import {accessibilityLabel, frame} from '@expo/ui/swift-ui/modifiers'
import {useRouter} from 'expo-router'
import {openUrl} from '@frogpond/open-url'

import {callPhone} from '../../../../components/call-phone'
import type {Station} from '../stations'
import {ActionButton} from './action-button'
import {AirPlayButtonStub} from './stubs'
import {usePalette} from './palette'

/** Full Schedule and Open Website, behind the title's ••• button. */
export function StationMenu({station}: {station: Station}): React.ReactNode {
	let router = useRouter()
	let palette = usePalette()
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
					onPress={() => router.navigate(station.scheduleHref)}
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

/**
 * The bottom row, after Music's: Call, Chat, AirPlay, and the schedule where
 * the queue sits, each labelled. Chat shows dimmed for a station without one.
 */
export function StationActionRow({
	station,
	onShowSchedule,
}: {
	station: Station
	onShowSchedule: () => void
}): React.ReactNode {
	let chatUrl = station.chatUrl
	return (
		<View style={styles.row}>
			<ActionButton
				accessibilityLabel={`Call ${station.stationName}`}
				icon="phone"
				label="Call"
				onPress={() => callPhone(station.stationNumber, {title: station.stationName})}
			/>
			<ActionButton
				accessibilityLabel={chatUrl ? `Chat with ${station.stationName}` : 'Chat unavailable'}
				icon="quote.bubble"
				label="Chat"
				onPress={chatUrl ? () => openUrl(chatUrl) : undefined}
			/>
			<AirPlayButtonStub />
			<ActionButton
				accessibilityLabel="Today's schedule"
				icon="list.bullet"
				label="Schedule"
				onPress={onShowSchedule}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', justifyContent: 'space-around'},
})
