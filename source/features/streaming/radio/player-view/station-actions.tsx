import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {openUrl} from '@frogpond/open-url'

import {callPhone} from '../../../../components/call-phone'
import type {Station} from '../stations'
import {ActionButton} from './action-button'
import {AirPlayButton} from './airplay-button'

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
				icon="bubble.left.and.text.bubble.right"
				label="Chat"
				onPress={chatUrl ? () => openUrl(chatUrl) : undefined}
				role="link"
			/>
			<AirPlayButton />
			<ActionButton
				accessibilityLabel="Today's schedule"
				icon="calendar.day.timeline.trailing"
				label="Schedule"
				onPress={onShowSchedule}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', justifyContent: 'space-around'},
})
