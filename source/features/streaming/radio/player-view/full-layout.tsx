import * as React from 'react'
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {TouchClaimView} from '@frogpond/touch-claim'

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
import {useFittedArtwork} from './use-fitted-artwork'
import {LockButton} from './lock-button'
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
	locked,
	onToggleLock,
	onHeldChange,
	viewportHeight,
}: {
	station: Station
	logo: RadioLogo
	showNextLogo?: () => void
	/** Whether today's schedule takes the record's place, as Music's queue does the art's. */
	showingSchedule: boolean
	onToggleSchedule: () => void
	/** Whether the sheet is held open, which is when a drag turns the record rather than closing the sheet. */
	locked: boolean
	onToggleLock: () => void
	/** Told when a finger lands on the record and when it lifts, so the scroll around it can hold still. */
	onHeldChange: (held: boolean) => void
	/** The height the player has to fit in: the sheet's, or the tab's between its bars. */
	viewportHeight: number
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	// The record takes whatever room the rest of the player leaves, so the
	// whole of it fits above a tab bar or a sheet's bottom edge.
	let {width} = useWindowDimensions()
	let fullWidth = width - 2 * SIDE
	let {artwork, onLayout} = useFittedArtwork({width: fullWidth, viewportHeight})

	return (
		<View onLayout={onLayout} style={styles.screen}>
			<StationPicker />
			<View
				style={[styles.artwork, {height: artwork, width: showingSchedule ? fullWidth : artwork}]}
			>
				{showingSchedule ? (
					<ScheduleList station={station} />
				) : (
					<TouchClaimView claims={locked} style={{width: artwork, height: artwork}}>
						<ScratchableLogo
							key={logo.name}
							accessibilityLabel={`${station.stationName} logo, ${logo.name}`}
							image={logo.image}
							labelColor={logo.labelColor}
							labelScale={logo.labelScale ?? 0.8}
							onHeldChange={onHeldChange}
							onTap={showNextLogo}
							playing={playState === 'playing'}
							scratchable={locked}
							size={artwork}
						/>
					</TouchClaimView>
				)}
				<View style={styles.lock}>
					<LockButton locked={locked} onToggle={onToggleLock} />
				</View>
			</View>
			<View style={styles.titleRow}>
				<ShowTitle station={station} />
				<StationMenu station={station} />
			</View>
			<LiveBar />
			<View style={styles.centre}>
				<PlayStopButton station={station} />
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
		gap: 20,
		paddingHorizontal: SIDE,
		paddingVertical: 20,
	},
	// As wide as the record, so the lock stays at its corner as it shrinks; the
	// schedule, which takes its place, keeps the player's width.
	artwork: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	// In the record's top-right corner, clear of its label.
	lock: {
		position: 'absolute',
		top: 0,
		right: -12,
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
