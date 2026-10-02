import * as React from 'react'
import {Image, StyleSheet, Text, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'
import {GlassView} from 'expo-glass-effect'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {STATIONS} from './stations'
import {useRadioStore} from './store'
import {describePlayback} from './describe-playback'

/** What the mini-player says, and VoiceOver reads, with no station loaded. */
const IDLE_LABEL = 'Not Playing'

/** The height of the Now Playing bar, as Music draws its accessory. */
export const NOW_PLAYING_BAR_HEIGHT = 48

/** Music's accessory insets from each side of the screen. */
const BAR_SIDE_MARGIN = 21

/**
 * Music's minimised accessory sits this far into the bottom safe area,
 * level with the home indicator's band rather than above it.
 */
const BAR_SAFE_AREA_OVERLAP = 6

/** Where the bar stands with no bottom safe area to sit in. */
const BAR_MINIMUM_BOTTOM = 8

/**
 * How far content must keep clear of the bottom safe area for the bar not to
 * cover it.
 */
export const NOW_PLAYING_BAR_CLEARANCE = NOW_PLAYING_BAR_HEIGHT - BAR_SAFE_AREA_OVERLAP + 8

type MiniPlayerProps = {
	/** A compact player drops the status line. */
	compact?: boolean
	/** With no station loaded, says "Not Playing" rather than rendering nothing. */
	showWhenIdle?: boolean
}

/**
 * The loaded station, with Play or Stop, laid out as Music's Now
 * Playing accessory. Tapping the station opens the radio's sheet. With no station
 * loaded it renders nothing, or the idle player when `showWhenIdle` asks for
 * it.
 */
export function RadioMiniPlayer({
	compact = false,
	showWhenIdle = false,
}: MiniPlayerProps): React.ReactNode {
	let openSheet = useRadioStore((state) => state.openSheet)
	let stationId = useRadioStore((state) => state.stationId)
	let playState = useRadioStore((state) => state.playState)
	let error = useRadioStore((state) => state.error)
	let play = useRadioStore((state) => state.play)
	let stop = useRadioStore((state) => state.stop)

	if (!stationId) {
		return showWhenIdle ? <IdleMiniPlayer /> : null
	}

	let station = STATIONS[stationId]
	let status = describePlayback(playState, error)
	let running = playState !== 'stopped'

	return (
		<View style={styles.row}>
			<Touchable
				accessibilityHint="Opens the radio"
				accessibilityLabel={`${station.stationName}, ${status}`}
				accessibilityRole="button"
				highlight={false}
				containerStyle={styles.stationContainer}
				onPress={() => openSheet()}
				style={styles.station}
			>
				<Image source={station.logos[0].image} style={styles.artwork} />
				<View style={styles.titles}>
					<Text numberOfLines={1} style={styles.name}>
						{station.stationName}
					</Text>
					{compact ? null : (
						<Text numberOfLines={1} style={styles.status}>
							{status}
						</Text>
					)}
				</View>
			</Touchable>

			{/* A live stream has no pause: Stop unloads it, and Play starts afresh. */}
			<Touchable
				accessibilityLabel={`${running ? 'Stop' : 'Play'} ${station.stationName}`}
				accessibilityRole="button"
				highlight={false}
				onPress={running ? stop : () => play(station.id)}
				style={styles.control}
			>
				<SymbolView name={running ? 'stop.fill' : 'play.fill'} size={20} tintColor={c.label} />
			</Touchable>
		</View>
	)
}

/**
 * The mini-player with no station loaded, as Music shows it: a blank artwork
 * tile and a dimmed Play. The whole of it is one button, opening the sheet on
 * the station last viewed.
 */
function IdleMiniPlayer(): React.ReactNode {
	let openSheet = useRadioStore((state) => state.openSheet)
	return (
		<Touchable
			accessibilityHint="Opens the radio"
			accessibilityLabel={IDLE_LABEL}
			accessibilityRole="button"
			highlight={false}
			onPress={() => openSheet()}
			style={styles.row}
		>
			<View style={styles.station}>
				<View style={[styles.artwork, styles.blankArtwork]}>
					<SymbolView name="radio" size={16} tintColor={c.tertiaryLabel} />
				</View>
				<View style={styles.titles}>
					<Text numberOfLines={1} style={styles.name}>
						{IDLE_LABEL}
					</Text>
				</View>
			</View>
			<View style={styles.control}>
				<SymbolView name="play.fill" size={20} tintColor={c.tertiaryLabel} />
			</View>
		</Touchable>
	)
}

/**
 * The Now Playing bar along the bottom of a screen with no tab bar to carry
 * it: Music's accessory, a capsule of liquid glass, stretched the full width.
 * The screen keeps its content `NOW_PLAYING_BAR_CLEARANCE` clear of the
 * bottom safe area so the bar never covers the last of it.
 */
export function RadioNowPlayingBar(): React.ReactNode {
	let insets = useSafeAreaInsets()
	let placement = {
		left: insets.left + BAR_SIDE_MARGIN,
		right: insets.right + BAR_SIDE_MARGIN,
		bottom: Math.max(insets.bottom - BAR_SAFE_AREA_OVERLAP, BAR_MINIMUM_BOTTOM),
	}

	return (
		<View pointerEvents="box-none" style={[styles.bar, placement]}>
			<GlassView isInteractive={true} style={styles.capsule}>
				<RadioMiniPlayer showWhenIdle={true} />
			</GlassView>
		</View>
	)
}

/**
 * The mini-player for a tab bar's bottom accessory. iOS draws the accessory's
 * glass itself, and narrows it inline beside a minimised tab bar.
 */
export function RadioTabAccessory({
	showWhenIdle = false,
}: Pick<MiniPlayerProps, 'showWhenIdle'>): React.ReactNode {
	let placement = NativeTabs.BottomAccessory.usePlacement()
	return <RadioMiniPlayer compact={placement === 'inline'} showWhenIdle={showWhenIdle} />
}

const styles = StyleSheet.create({
	bar: {
		position: 'absolute',
	},
	capsule: {
		height: NOW_PLAYING_BAR_HEIGHT,
		borderRadius: NOW_PLAYING_BAR_HEIGHT / 2,
		justifyContent: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 9,
		paddingRight: 7,
	},
	// The Pressable, not the view inside it, has to take the spare width, or
	// only the drawn artwork and text would answer a tap.
	stationContainer: {
		flex: 1,
	},
	station: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 44,
	},
	artwork: {
		width: 30,
		height: 30,
		borderRadius: 6,
	},
	blankArtwork: {
		backgroundColor: c.tertiarySystemFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	titles: {
		flex: 1,
		marginLeft: 9,
	},
	name: {
		color: c.label,
		fontSize: 15,
		fontWeight: '600',
	},
	status: {
		color: c.label,
		fontSize: 15,
	},
	control: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
