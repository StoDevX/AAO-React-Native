import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {openUrl} from '@frogpond/open-url'
import {Touchable} from '@frogpond/touchable'
import {useRouter} from 'expo-router'
import {SymbolView, type SFSymbol} from 'expo-symbols'

import {callPhone} from '../../../../components/call-phone'
import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import {SIDE} from './full-layout'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ShowTitle} from './show-title'
import {StationPicker} from './station-picker'
import {usePalette} from './palette'
import type {RadioLogo} from '../theme'

/** The size of the record at the medium detent. */
const RECORD = 96

/** The medium detent: the picker, then a row like an enlarged mini-player, then the actions. */
export function CompactLayout({
	station,
	logo,
}: {
	station: Station
	logo: RadioLogo
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	let router = useRouter()
	let chatUrl = station.chatUrl

	return (
		<View style={styles.screen}>
			<StationPicker />
			<View style={styles.row}>
				{/* No tap here: at this size a scratch would fight the sheet's drag. */}
				<ScratchableLogo
					accessibilityLabel={`${station.stationName} logo, ${logo.name}`}
					image={logo.image}
					labelColor={logo.labelColor}
					labelScale={logo.labelScale ?? 0.8}
					playing={playState === 'playing'}
					size={RECORD}
				/>
				<ShowTitle station={station} />
				<PlayStopButton size="small" station={station} />
			</View>
			<PlaybackError station={station} />
			<View style={styles.actions}>
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
				<ActionButton
					accessibilityLabel={`${station.stationName} schedule`}
					icon="calendar"
					label="Schedule"
					onPress={() => router.navigate(station.scheduleHref)}
				/>
			</View>
		</View>
	)
}

/** One of the three actions under the medium detent's row. With no `onPress` it shows, dimmed, as unavailable. */
function ActionButton({
	icon,
	label,
	accessibilityLabel,
	onPress,
}: {
	icon: SFSymbol
	label: string
	accessibilityLabel: string
	onPress?: () => void
}): React.ReactNode {
	let palette = usePalette()
	let tint = onPress ? palette.primary : palette.tertiary
	return (
		<Touchable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{disabled: !onPress}}
			disabled={!onPress}
			highlight={false}
			onPress={onPress}
			style={styles.action}
		>
			<SymbolView name={icon} size={24} tintColor={tint} />
			<Text
				style={[styles.actionLabel, onPress ? palette.styles.primary : palette.styles.tertiary]}
			>
				{label}
			</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		gap: 20,
		paddingHorizontal: SIDE,
		paddingTop: 20,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	action: {
		minWidth: 64,
		minHeight: 44,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
	},
	actionLabel: {
		fontSize: 13,
	},
})
