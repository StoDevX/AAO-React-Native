import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {openUrl} from '@frogpond/open-url'

import {callPhone} from '../../../../components/call-phone'
import {track} from '../../../telemetry/track'
import {captionsButtonLabel, useCaptionsAvailability, type Panel} from '../captions'
import type {Station} from '../stations'
import {ActionButton} from './action-button'
import {AirPlayButton} from './airplay-button'

/**
 * The bottom row, after Music's: Call, Chat, AirPlay, and the schedule where
 * the queue sits, each labelled. Chat shows dimmed for a station without one,
 * and so does Captions, unless the station is loaded and can be captioned.
 * Schedule and Captions each pick the panel that takes the record's place.
 */
export function StationActionRow({
	station,
	panel,
	onSelectPanel,
}: {
	station: Station
	/** The panel showing, which its button marks as selected. */
	panel: Panel
	onSelectPanel: (panel: 'schedule' | 'captions') => void
}): React.ReactNode {
	let chatUrl = station.chatUrl
	let availability = useCaptionsAvailability(station)
	return (
		<View style={styles.row}>
			<ActionButton
				accessibilityLabel={`Call ${station.stationName}`}
				icon="phone"
				label="Call"
				onPress={() => {
					track({name: 'radio.action', attributes: {action: 'call', station: station.id}})
					callPhone(station.stationNumber, {title: station.stationName})
				}}
			/>
			<ActionButton
				accessibilityLabel={chatUrl ? `Chat with ${station.stationName}` : 'Chat unavailable'}
				icon="bubble.left.and.text.bubble.right"
				label="Chat"
				onPress={
					chatUrl
						? () => {
								track({name: 'radio.action', attributes: {action: 'chat', station: station.id}})
								openUrl(chatUrl)
							}
						: undefined
				}
				role="link"
			/>
			<AirPlayButton />
			<ActionButton
				accessibilityLabel={captionsButtonLabel(availability, station.stationName)}
				icon="captions.bubble"
				label="Captions"
				onPress={availability === 'available' ? () => onSelectPanel('captions') : undefined}
				selected={panel === 'captions'}
			/>
			<ActionButton
				accessibilityLabel="Today's schedule"
				icon="calendar.day.timeline.trailing"
				label="Schedule"
				onPress={() => {
					track({name: 'radio.action', attributes: {action: 'schedule', station: station.id}})
					onSelectPanel('schedule')
				}}
				selected={panel === 'schedule'}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', justifyContent: 'space-around'},
})
