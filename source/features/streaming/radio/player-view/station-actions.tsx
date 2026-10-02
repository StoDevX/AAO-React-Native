import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'
import {Button, Host, Image, Menu} from '@expo/ui/swift-ui'
import {accessibilityLabel, frame} from '@expo/ui/swift-ui/modifiers'
import {useRouter} from 'expo-router'
import {openUrl} from '@frogpond/open-url'

import {callPhone} from '../../../../components/call-phone'
import type {Station} from '../stations'
import {AirPlayButtonStub} from './stubs'
import {usePalette} from './palette'

/** Call, Chat, Full Schedule and Open Website, behind the title's ••• button. */
export function StationMenu({station}: {station: Station}): React.ReactNode {
	let router = useRouter()
	let chatUrl = station.chatUrl
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
					label={`Call ${station.stationName}`}
					onPress={() => callPhone(station.stationNumber, {title: station.stationName})}
					systemImage="phone"
				/>
				{chatUrl ? (
					<Button label="Chat" onPress={() => openUrl(chatUrl)} systemImage="quote.bubble" />
				) : null}
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

/** The bottom row, after Music's: Chat where Lyrics sits, AirPlay, and the schedule where the queue sits. */
export function StationActionRow({
	station,
	onShowSchedule,
}: {
	station: Station
	onShowSchedule: () => void
}): React.ReactNode {
	let chatUrl = station.chatUrl
	let palette = usePalette()
	return (
		<View style={styles.row}>
			<Touchable
				accessibilityLabel={chatUrl ? `Chat with ${station.stationName}` : 'Chat unavailable'}
				accessibilityRole="button"
				disabled={!chatUrl}
				highlight={false}
				onPress={chatUrl ? () => openUrl(chatUrl) : undefined}
				style={styles.action}
			>
				<SymbolView
					name="quote.bubble"
					size={24}
					tintColor={chatUrl ? palette.primary : palette.tertiary}
				/>
			</Touchable>
			<AirPlayButtonStub />
			<Touchable
				accessibilityLabel="Today's schedule"
				accessibilityRole="button"
				highlight={false}
				onPress={onShowSchedule}
				style={styles.action}
			>
				<SymbolView name="list.bullet" size={24} tintColor={palette.primary} />
			</Touchable>
		</View>
	)
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', justifyContent: 'space-around'},
	action: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
})
