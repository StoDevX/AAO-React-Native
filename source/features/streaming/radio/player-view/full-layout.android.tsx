import * as React from 'react'
import {Animated, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {SymbolView} from 'expo-symbols'
import {TouchClaimView} from '@frogpond/touch-claim'

import {FILLED_SYMBOL_WEIGHT} from '../../../../lib/filled-symbol-weight'
import {ScratchableLogo} from '../scratchable-logo'
import {logoImage, type Station} from '../stations'
import {useRadioStore, useStationPlayback} from '../store'
import {useNowPlaying} from '../use-now-playing'
import {useRadioControl} from '../use-radio-control'
import {useStationSchedule} from '../use-station-schedule'
import {PlaybackError} from './play-stop-button'
import {ScheduleRow} from './schedule-list'
import {scheduleNote} from './schedule-note'
import {ShowTitle} from './show-title'
import {airStatusText} from './show-title-text'
import {StationActionRow} from './station-actions'
import {StationPicker} from './station-picker'
import {palette} from './palette'
import type {RadioLogo} from '../theme'

/** The player's side margins: Material's 24 dp. */
const SIDE = 24
/** The artwork's corners: Material's extra-large shape. */
const ARTWORK_RADIUS = 28
/** The play button, and its corners playing (a rounded square) and paused (a circle). */
const PLAY_SIZE = 96
const PLAYING_RADIUS = 28
const PAUSED_RADIUS = PLAY_SIZE / 2
/** How many of today's next shows the page lists under the player. */
const UP_NEXT = 3

const SONG_ARTWORK = (uri: string) => ({uri})

/**
 * The radio player on Android, as Material's media players lay one out: the
 * stations as tabs, the artwork in a large rounded square, the show and a
 * Live chip under it, a large play button whose shape says whether it plays
 * (a rounded square) or not (a circle), the station's actions, and the next
 * shows listed on the page. No volume slider: Android sets volume with its
 * own keys and panel.
 */
export function FullLayout({
	station,
	logo,
	showNextLogo,
}: {
	station: Station
	logo: RadioLogo
	showNextLogo?: () => void
	showingSchedule?: boolean
	onToggleSchedule?: () => void
	viewportHeight?: number
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	let {width} = useWindowDimensions()
	let artwork = Math.min(width - 2 * SIDE, 360)
	let schedule = useStationSchedule(station.schedule)
	let nowPlaying = useNowPlaying(station)
	let songArtwork = nowPlaying.isSong && nowPlaying.artworkUri !== logoImage(logo).uri
	let {text: airText} = airStatusText(schedule.current, schedule.status)
	let note = scheduleNote(schedule.status, schedule.upcoming.length)
	let openFullSchedule = useRadioStore((state) => state.openFullSchedule)

	return (
		<View style={styles.screen}>
			<StationPicker />
			<View style={styles.body}>
				<View style={[styles.artwork, {width: artwork, height: artwork}]}>
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
							playing={playState === 'playing'}
							size={artwork}
						/>
					</TouchClaimView>
				</View>

				<View style={styles.titleRow}>
					<View style={styles.title}>
						<ShowTitle current={schedule.current} station={station} status={schedule.status} />
					</View>
					{airText ? (
						<View style={styles.chip}>
							<Text style={[styles.chipText, palette.styles.primary]}>{airText}</Text>
						</View>
					) : null}
				</View>

				<View style={styles.centre}>
					<PlayButton station={station} />
					<PlaybackError station={station} />
				</View>

				<StationActionRow onShowSchedule={openFullSchedule} station={station} />

				<View style={styles.upNext}>
					<Text style={[styles.heading, palette.styles.primary]}>Up next</Text>
					{note ? (
						<Text style={[styles.note, palette.styles.secondary]}>{note}</Text>
					) : (
						schedule.upcoming
							.slice(0, UP_NEXT)
							.map((show) => (
								<ScheduleRow key={`${show.startTime.valueOf()}|${show.title}`} show={show} />
							))
					)}
				</View>
			</View>
		</View>
	)
}

/**
 * Play and Pause: Material 3 Expressive's large button, a circle that rounds
 * into a square while the station plays, so its shape says what it is doing.
 */
function PlayButton({station}: {station: Station}): React.ReactNode {
	let {label, icon, press} = useRadioControl(station, 'sheet')
	let {playState} = useStationPlayback(station.id)
	let playing = playState === 'playing' || playState === 'starting'
	let [radius] = React.useState(() => new Animated.Value(playing ? PLAYING_RADIUS : PAUSED_RADIUS))
	React.useEffect(() => {
		Animated.spring(radius, {
			toValue: playing ? PLAYING_RADIUS : PAUSED_RADIUS,
			useNativeDriver: false,
			bounciness: 6,
		}).start()
	}, [radius, playing])

	return (
		<Pressable accessibilityLabel={label} accessibilityRole="button" onPress={press}>
			<Animated.View style={[styles.play, {borderRadius: radius}]}>
				<SymbolView
					name={icon}
					size={40}
					tintColor={palette.primary}
					weight={FILLED_SYMBOL_WEIGHT}
				/>
			</Animated.View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	screen: {gap: 16},
	body: {gap: 24, paddingHorizontal: SIDE, paddingBottom: 24},
	artwork: {
		alignSelf: 'center',
		borderRadius: ARTWORK_RADIUS,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
	title: {flex: 1},
	chip: {
		height: 32,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: palette.track,
		justifyContent: 'center',
	},
	chipText: {fontSize: 14, fontWeight: '500'},
	centre: {alignItems: 'center', gap: 8},
	play: {
		width: PLAY_SIZE,
		height: PLAY_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: palette.track,
	},
	upNext: {gap: 12},
	heading: {fontSize: 14, fontWeight: '500'},
	note: {fontSize: 16},
})
