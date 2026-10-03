import * as React from 'react'
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native'

import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ScheduleList} from './schedule-list'
import {ShowTitle} from './show-title'
import {StationActionRow} from './station-actions'
import {StationMenu} from './station-menu'
import {StationPicker} from './station-picker'
import {VolumeSliderStub} from './stubs'
import {palette} from './palette'
import type {RadioLogo} from '../theme'

/** The player's inset from each side, as Music's full player. */
export const SIDE = 28

/** Music's full player for a live station, with the record where the album art goes. */
export function FullLayout({
	station,
	logo,
	showNextLogo,
	showingSchedule,
	onToggleSchedule,
	scratchable,
	onLogoHeldChange,
	onLogoSettle,
}: {
	station: Station
	logo: RadioLogo
	showNextLogo?: () => void
	/** Whether today's schedule takes the record's place, as Music's queue does the art's. */
	showingSchedule: boolean
	onToggleSchedule: () => void
	/** Whether a drag turns the record. Off in the sheet, where a drag closes it. */
	scratchable: boolean
	/** A finger has come down on the record, or lifted, so a scratch can hold off the screen's swipe-back. */
	onLogoHeldChange?: (held: boolean) => void
	/** The record has stopped moving under a scratch. */
	onLogoSettle?: () => void
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	let {width} = useWindowDimensions()
	let artwork = width - 2 * SIDE

	return (
		<View style={styles.screen}>
			<StationPicker />
			<View style={[styles.artwork, {height: artwork}]}>
				{showingSchedule ? (
					<ScheduleList station={station} />
				) : (
					<ScratchableLogo
						key={logo.name}
						accessibilityLabel={`${station.stationName} logo, ${logo.name}`}
						image={logo.image}
						labelColor={logo.labelColor}
						labelScale={logo.labelScale ?? 0.8}
						onHeldChange={onLogoHeldChange}
						onSettle={onLogoSettle}
						onTap={showNextLogo}
						playing={playState === 'playing'}
						scratchable={scratchable}
						size={artwork}
					/>
				)}
			</View>
			<View style={styles.titleRow}>
				<ShowTitle station={station} />
				<StationMenu station={station} />
			</View>
			<LiveBar />
			<View style={styles.centre}>
				<PlayStopButton size="large" station={station} />
				<PlaybackError station={station} />
			</View>
			<VolumeSliderStub />
			<StationActionRow onShowSchedule={onToggleSchedule} station={station} />
		</View>
	)
}

/** Music's "LIVE" in place of a scrubber: a stream has no position to show. */
function LiveBar(): React.ReactNode {
	return (
		<View accessibilityLabel="Live" accessible={true} style={styles.live}>
			<View style={[styles.track, palette.styles.track]} />
			<Text style={[styles.liveText, palette.styles.secondary]}>LIVE</Text>
			<View style={[styles.track, palette.styles.track]} />
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		gap: 20,
		paddingHorizontal: SIDE,
		paddingTop: 20,
	},
	artwork: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	centre: {
		alignItems: 'center',
	},
	live: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	track: {
		flex: 1,
		height: 6,
		borderRadius: 3,
	},
	liveText: {
		fontSize: 13,
		fontWeight: '600',
	},
})
