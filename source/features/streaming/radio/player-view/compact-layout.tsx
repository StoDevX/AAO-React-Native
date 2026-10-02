import * as React from 'react'
import {StyleSheet, View} from 'react-native'

import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import type {RadioLogo} from '../theme'
import {SIDE} from './full-layout'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ShowTitle} from './show-title'
import {StationActionRow, StationMenu} from './station-actions'
import {StationPicker} from './station-picker'

/** The size of the record at the medium detent. */
const RECORD = 96

/**
 * The medium detent: the picker, the record beside what's on, a large Play or
 * Stop, and the full player's own bottom row, pinned to the bottom.
 * `onShowSchedule` is the bottom row's schedule button, which has no artwork
 * area to swap here.
 */
export function CompactLayout({
	station,
	logo,
	onShowSchedule,
}: {
	station: Station
	logo: RadioLogo
	onShowSchedule: () => void
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)

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
				<StationMenu station={station} />
			</View>
			<View style={styles.centre}>
				<PlayStopButton size="large" station={station} />
				<PlaybackError station={station} />
			</View>
			<View style={styles.spacer} />
			<StationActionRow onShowSchedule={onShowSchedule} station={station} />
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		gap: 20,
		paddingHorizontal: SIDE,
		paddingTop: 20,
		paddingBottom: 28,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	centre: {
		alignItems: 'center',
	},
	spacer: {
		flex: 1,
	},
})
