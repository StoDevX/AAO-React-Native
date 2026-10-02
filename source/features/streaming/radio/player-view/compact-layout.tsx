import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Host, RNHostView, VStack} from '@expo/ui/swift-ui'
import {padding} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
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
import {useLogoCycle} from './use-logo-cycle'

/** The size of the record at the medium detent. */
const RECORD = 96

/** The medium detent: the picker, then a row like an enlarged mini-player, then the actions. */
export function CompactLayout({station}: {station: Station}): React.ReactNode {
	let {logo} = useLogoCycle(station)
	let {playState} = useStationPlayback(station.id)
	let router = useRouter()
	let chatUrl = station.chatUrl

	return (
		<Host style={styles.fill}>
			<VStack modifiers={[padding({horizontal: SIDE, top: 12})]} spacing={20}>
				<StationPicker />
				<RNHostView matchContents={true}>
					<View style={styles.stack}>
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
								icon="phone"
								label="Call"
								accessibilityLabel={`Call ${station.stationName}`}
								onPress={() => callPhone(station.stationNumber, {title: station.stationName})}
							/>
							<ActionButton
								icon="quote.bubble"
								label="Chat"
								accessibilityLabel={
									chatUrl ? `Chat with ${station.stationName}` : 'Chat unavailable'
								}
								onPress={chatUrl ? () => openUrl(chatUrl) : undefined}
							/>
							<ActionButton
								icon="calendar"
								label="Schedule"
								accessibilityLabel={`${station.stationName} schedule`}
								onPress={() => router.navigate(station.scheduleHref)}
							/>
						</View>
					</View>
				</RNHostView>
			</VStack>
		</Host>
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
	let tint = onPress ? c.label : c.tertiaryLabel
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
			<Text style={onPress ? styles.actionLabel : styles.actionLabelDimmed}>{label}</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	stack: {
		gap: 20,
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
		color: c.label,
	},
	actionLabelDimmed: {
		fontSize: 13,
		color: c.tertiaryLabel,
	},
})
