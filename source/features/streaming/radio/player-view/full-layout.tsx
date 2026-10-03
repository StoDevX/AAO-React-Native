import * as React from 'react'
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import {TouchClaimView} from '@frogpond/touch-claim'

import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import {useNowPlaying} from '../use-now-playing'
import {useStationSchedule} from '../use-station-schedule'
import {CreditsMenu} from './credits-menu'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ScheduleList} from './schedule-list'
import type {ScheduleStatus} from './schedule-note'
import {ShowTitle} from './show-title'
import {airStatusText} from './show-title-text'
import {StationActionRow} from './station-actions'
import {StationMenu} from './station-menu'
import {StationPicker} from './station-picker'
import {VolumeSlider} from './volume-slider'
import {useFittedArtwork} from './use-fitted-artwork'
import {palette} from './palette'
import type {RadioLogo} from '../theme'

/** A cover from the feed as the record's label takes it: the feed sends 600-point squares. */
const SONG_ARTWORK = (uri: string) => ({uri, width: 600, height: 600, scale: 1})

/** The player's inset from each side, as Music's full player. */
export const SIDE = 28

/** What UI tests find the status line by, since its words change with the schedule. */
const AIR_STATUS_ID = 'radio-air-status'

/** Music's full player for a live station, with the record where the album art goes. */
export function FullLayout({
	station,
	logo,
	showNextLogo,
	showingSchedule,
	onToggleSchedule,
	viewportHeight,
}: {
	station: Station
	logo: RadioLogo
	showNextLogo?: () => void
	/** Whether today's schedule takes the record's place, as Music's queue does the art's. */
	showingSchedule: boolean
	onToggleSchedule: () => void
	/** The height the player has to fit in: the sheet's, or the tab's between its bars. */
	viewportHeight: number
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	// The record takes whatever room the rest of the player leaves, so the
	// whole of it fits above a tab bar or a sheet's bottom edge.
	let {width} = useWindowDimensions()
	let fullWidth = width - 2 * SIDE
	let {artwork, onLayout} = useFittedArtwork({width: fullWidth, viewportHeight})
	// One schedule for the title, the status line and the list, so they
	// share a clock and never disagree on a minute boundary.
	let schedule = useStationSchedule(station.id)
	// The song's own cover fills the record's label, where it has one; a song
	// without a cover, or none on air, leaves the station's logo.
	let nowPlaying = useNowPlaying(station)
	let songArtwork = nowPlaying.isSong && nowPlaying.artworkUri !== logo.image.uri

	return (
		<View onLayout={onLayout} style={styles.screen}>
			<View style={styles.pickerRow}>
				<View style={styles.picker}>
					<StationPicker />
				</View>
				<CreditsMenu />
			</View>
			<View style={[styles.artwork, {height: artwork}]}>
				{showingSchedule ? (
					<ScheduleList status={schedule.status} upcoming={schedule.upcoming} />
				) : (
					<TouchClaimView>
						<ScratchableLogo
							key={logo.name}
							accessibilityLabel={
								songArtwork
									? `${nowPlaying.title}, ${station.stationName}`
									: `${station.stationName} logo, ${logo.name}`
							}
							image={songArtwork ? SONG_ARTWORK(nowPlaying.artworkUri) : logo.image}
							labelColor={logo.labelColor}
							labelScale={songArtwork ? 1 : (logo.labelScale ?? 0.8)}
							onTap={showNextLogo}
							playing={playState === 'playing'}
							size={artwork}
						/>
					</TouchClaimView>
				)}
			</View>
			<View style={styles.titleRow}>
				<ShowTitle current={schedule.current} station={station} status={schedule.status} />
				<StationMenu station={station} />
			</View>
			<AirStatusBar current={schedule.current} status={schedule.status} />
			<View style={styles.centre}>
				<PlayStopButton station={station} />
				<PlaybackError station={station} />
			</View>
			<VolumeSlider />
			<StationActionRow onShowSchedule={onToggleSchedule} station={station} />
		</View>
	)
}

/** Music's scrubber's place: a stream has no position to show, so the schedule says if it is on air. */
function AirStatusBar({
	current,
	status,
}: {
	current: EventType | null
	status: ScheduleStatus
}): React.ReactNode {
	let {text, spoken} = airStatusText(current, status)
	return (
		<View
			accessibilityLabel={spoken}
			accessible={true}
			testID={AIR_STATUS_ID}
			style={styles.airStatus}
		>
			<View style={[styles.track, palette.styles.track]} />
			{/* With nothing to say, one unbroken track rather than two with a gap. */}
			{text ? (
				<>
					<Text style={[styles.airStatusText, palette.styles.secondary]}>{text}</Text>
					<View style={[styles.track, palette.styles.track]} />
				</>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		gap: 20,
		paddingHorizontal: SIDE,
		paddingVertical: 20,
	},
	artwork: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	pickerRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	picker: {
		flex: 1,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	centre: {
		alignItems: 'center',
	},
	airStatus: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	track: {
		flex: 1,
		height: 6,
		borderRadius: 3,
	},
	airStatusText: {
		fontSize: 13,
		fontWeight: '600',
	},
})
