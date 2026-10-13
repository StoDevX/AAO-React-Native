import * as React from 'react'
import {Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {EventType} from '@frogpond/event-type'
import {TouchClaimView} from '@frogpond/touch-claim'

import {ScratchableLogo} from '../scratchable-logo'
import {logoImage, type Station} from '../stations'
import {useRadioStore, useStationPlayback} from '../store'
import {useNowPlaying} from '../use-now-playing'
import {audioScratch, canScratchAudio, useScrubPlayback} from '../use-radio-scrub'
import {AudioScrubControls} from './audio-scrub-controls'
import {useStationSchedule} from '../use-station-schedule'
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
import {useDeckSide} from './use-deck-side'
import {palette} from './palette'
import type {RadioLogo} from '../theme'

/** A cover from the feed as the record's label takes it: the feed sends 600-point squares. */
const SONG_ARTWORK = (uri: string) => ({uri, width: 600, height: 600, scale: 1})

/** The player's inset from each side, as Music's full player. */
export const SIDE = 28

const PLAYER_GAP = 20
const PLAYER_VERTICAL_PADDING = 20
const LANDSCAPE_GAP = 24

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
	let djMode = useRadioStore((state) => state.djMode)
	let setDJMode = useRadioStore((state) => state.setDJMode)
	let delayed = useScrubPlayback(
		(state) => state.stationId === station.id && state.delaySeconds >= 0.25,
	)
	let pitch = useScrubPlayback((state) => (state.stationId === station.id ? state.pitch : 0))
	let scratchingAudio = React.useRef(false)
	let scratchStart = React.useCallback(() => {
		scratchingAudio.current = djMode && playState === 'playing' && canScratchAudio(station.id)
		if (scratchingAudio.current) audioScratch.begin()
	}, [djMode, playState, station.id])
	let scratchMove = React.useCallback((velocity: number) => {
		if (scratchingAudio.current) audioScratch.move(velocity)
	}, [])
	let scratchEnd = React.useCallback((velocity: number) => {
		if (scratchingAudio.current) audioScratch.release(velocity)
		scratchingAudio.current = false
	}, [])
	// Landscape keeps the record visible while the independent controls column scrolls.
	let {width, height} = useWindowDimensions()
	let landscape = width > height
	let deckSide = useDeckSide()
	let [containerWidth, setContainerWidth] = React.useState(0)
	let [pickerHeight, setPickerHeight] = React.useState(44)
	let fullWidth = Math.max(160, (containerWidth || width) - 2 * SIDE)
	let landscapeHeight = Math.max(
		160,
		viewportHeight - pickerHeight - PLAYER_GAP - 2 * PLAYER_VERTICAL_PADDING,
	)
	let deckWidth = landscape ? Math.min((fullWidth - LANDSCAPE_GAP) / 2, landscapeHeight) : fullWidth
	let {artwork, onLayout} = useFittedArtwork({
		width: deckWidth,
		viewportHeight,
		minimum: landscape || (djMode && !showingSchedule) ? deckWidth : 160,
	})
	let dimensions = React.useMemo(
		() =>
			StyleSheet.create({
				artwork: {width: deckWidth, height: artwork},
				landscapeControls: {height: landscapeHeight},
			}),
		[deckWidth, artwork, landscapeHeight],
	)
	// One schedule for the title, the status line and the list, so they
	// share a clock and never disagree on a minute boundary.
	let schedule = useStationSchedule(station.schedule)
	// The song's own cover fills the record's label, where it has one; a song
	// without a cover, or none on air, leaves the station's logo.
	let nowPlaying = useNowPlaying(station)
	let songArtwork = !delayed && nowPlaying.isSong && nowPlaying.artworkUri !== logoImage(logo).uri

	let controls = (
		<>
			<View style={styles.titleRow}>
				<ShowTitle
					current={delayed ? null : schedule.current}
					station={station}
					status={delayed ? 'error' : schedule.status}
				/>
				{djMode ? (
					<Pressable
						accessibilityLabel="Exit DJ Mode"
						accessibilityRole="button"
						accessibilityState={{selected: true}}
						onPress={() => setDJMode(false)}
						style={styles.modeButton}
					>
						<SymbolView name="slider.horizontal.3" size={20} tintColor={palette.primary} />
					</Pressable>
				) : null}
				<StationMenu station={station} />
			</View>
			{!delayed && nowPlaying.isSong ? (
				<View style={styles.nowPlaying}>
					<Text
						accessibilityRole="header"
						style={[styles.nowPlayingLabel, palette.styles.secondary]}
					>
						Now playing
					</Text>
					<Text style={[styles.songTitle, palette.styles.primary]}>{nowPlaying.title}</Text>
					{nowPlaying.artist ? (
						<Text style={[styles.songArtist, palette.styles.secondary]}>{nowPlaying.artist}</Text>
					) : null}
				</View>
			) : null}
			<AirStatusBar current={schedule.current} status={schedule.status} />
			{djMode ? (
				<AudioScrubControls key={station.id} stationId={station.id} tintColor={logo.tint} />
			) : null}
			<View style={styles.centre}>
				<PlayStopButton station={station} />
				<PlaybackError station={station} />
			</View>
			<VolumeSlider />
			<StationActionRow onShowSchedule={onToggleSchedule} station={station} />
		</>
	)

	return (
		<View
			onLayout={(event) => {
				let nextWidth = event.nativeEvent.layout.width
				setContainerWidth((current) => (current === nextWidth ? current : nextWidth))
				onLayout(event)
			}}
			style={styles.screen}
		>
			<View
				onLayout={(event) => {
					let nextHeight = event.nativeEvent.layout.height
					setPickerHeight((current) => (current === nextHeight ? current : nextHeight))
				}}
			>
				<StationPicker />
			</View>
			<View
				style={[
					styles.deck,
					landscape && styles.landscapeDeck,
					landscape && deckSide === 'right' && styles.turntableRight,
				]}
			>
				<View style={[styles.artwork, dimensions.artwork]}>
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
								image={songArtwork ? SONG_ARTWORK(nowPlaying.artworkUri) : logoImage(logo)}
								labelColor={logo.labelColor}
								labelScale={songArtwork ? 1 : (logo.labelScale ?? 0.8)}
								onTap={showNextLogo}
								onScratchStart={scratchStart}
								onScratchMove={scratchMove}
								onScratchEnd={scratchEnd}
								playbackRate={1 + pitch / 100}
								playing={playState === 'playing'}
								size={djMode ? artwork / 1.06 : artwork}
							/>
						</TouchClaimView>
					)}
				</View>
				{landscape ? (
					<ScrollView
						style={[styles.landscapeControls, dimensions.landscapeControls]}
						contentContainerStyle={styles.playerControls}
						nestedScrollEnabled={true}
					>
						{controls}
					</ScrollView>
				) : (
					<View style={styles.playerControls}>{controls}</View>
				)}
			</View>
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
		gap: PLAYER_GAP,
		paddingHorizontal: SIDE,
		paddingVertical: PLAYER_VERTICAL_PADDING,
	},
	deck: {gap: PLAYER_GAP},
	landscapeDeck: {flexDirection: 'row', alignItems: 'flex-start', gap: LANDSCAPE_GAP},
	turntableRight: {flexDirection: 'row-reverse'},
	landscapeControls: {flex: 1},
	playerControls: {gap: PLAYER_GAP},
	nowPlaying: {gap: 4},
	nowPlayingLabel: {fontSize: 14, fontWeight: '600'},
	songTitle: {fontSize: 22, fontWeight: '600'},
	songArtist: {fontSize: 18},
	modeButton: {
		minWidth: 44,
		minHeight: 44,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 22,
		backgroundColor: palette.track,
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
