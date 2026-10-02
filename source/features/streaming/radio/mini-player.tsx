import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {SymbolView} from 'expo-symbols'
import {GlassView, isLiquidGlassAvailable} from 'expo-glass-effect'
import {usePathname, useRouter} from 'expo-router'
import {NativeTabs} from 'expo-router/unstable-native-tabs'
import {STATIONS} from './stations'
import {useRadioStore} from './store'
import {describePlayback} from './describe-playback'

/**
 * Sections whose screens sit in native tabs. Their tab bar shows the
 * mini-player as its bottom accessory, above the bar or inline beside it once
 * a scroll minimises it, so the floating one stays out of the way there.
 */
const TABBED_SECTIONS = ['/streaming-media', '/menus']

/** What the mini-player says, and VoiceOver reads, with no station loaded. */
const IDLE_LABEL = 'Not Playing'

type MiniPlayerProps = {
	/** A compact player drops the status line and the stop button. */
	compact?: boolean
	/** With no station loaded, says "Not Playing" rather than rendering nothing. */
	showWhenIdle?: boolean
}

/**
 * The loaded station, with play/pause and stop, from anywhere in the app.
 * Tapping the station opens its screen. With no station loaded it renders
 * nothing, or the idle player when `showWhenIdle` asks for it.
 */
export function RadioMiniPlayer({
	compact = false,
	showWhenIdle = false,
}: MiniPlayerProps): React.ReactNode {
	let router = useRouter()
	let stationId = useRadioStore((state) => state.stationId)
	let playState = useRadioStore((state) => state.playState)
	let error = useRadioStore((state) => state.error)
	let play = useRadioStore((state) => state.play)
	let pause = useRadioStore((state) => state.pause)
	let stop = useRadioStore((state) => state.stop)

	if (!stationId) {
		return showWhenIdle ? <IdleMiniPlayer /> : null
	}

	let station = STATIONS[stationId]
	let status = describePlayback(playState, error)
	let running = playState !== 'paused'

	return (
		<View style={styles.row}>
			<Touchable
				accessibilityHint="Opens the station"
				accessibilityLabel={`${station.stationName}, ${status}`}
				accessibilityRole="button"
				highlight={false}
				containerStyle={styles.stationContainer}
				onPress={() => router.navigate(station.href)}
				style={styles.station}
			>
				<SymbolView name="radio.fill" size={24} tintColor={c.label} />
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

			<Touchable
				accessibilityLabel={`${running ? 'Pause' : 'Play'} ${station.stationName}`}
				accessibilityRole="button"
				highlight={false}
				onPress={running ? pause : () => play(station.id)}
				style={styles.control}
			>
				<SymbolView name={running ? 'pause.fill' : 'play.fill'} size={22} tintColor={c.label} />
			</Touchable>

			{compact ? null : (
				<Touchable
					accessibilityLabel={`Stop ${station.stationName}`}
					accessibilityRole="button"
					highlight={false}
					onPress={stop}
					style={styles.control}
				>
					<SymbolView name="xmark" size={18} tintColor={c.secondaryLabel} />
				</Touchable>
			)}
		</View>
	)
}

/**
 * The mini-player with no station loaded. Nothing in it does anything, so
 * VoiceOver reads it as one piece of text rather than offering a dead button.
 */
function IdleMiniPlayer(): React.ReactNode {
	return (
		<View accessible={true} accessibilityLabel={IDLE_LABEL} style={styles.row}>
			<View style={styles.station}>
				<SymbolView name="radio" size={24} tintColor={c.tertiaryLabel} />
				<View style={styles.titles}>
					<Text numberOfLines={1} style={styles.name}>
						{IDLE_LABEL}
					</Text>
				</View>
			</View>
			<View style={styles.control}>
				<SymbolView name="play.fill" size={22} tintColor={c.tertiaryLabel} />
			</View>
		</View>
	)
}

/**
 * The mini-player floating above the bottom of every screen outside the tabbed
 * sections, which show it in their tab bar instead. A capsule of liquid glass
 * where iOS has it, matching the tab bar's own accessory, and a plain card
 * elsewhere.
 */
const GLASS = isLiquidGlassAvailable()

export function RadioMiniPlayerOverlay(): React.ReactNode {
	let insets = useSafeAreaInsets()
	let pathname = usePathname()
	let loaded = useRadioStore((state) => state.stationId !== null)

	let inTabs = TABBED_SECTIONS.some(
		(section) => pathname === section || pathname.startsWith(`${section}/`),
	)
	if (!loaded || inTabs) {
		return null
	}

	return (
		<View pointerEvents="box-none" style={[styles.overlay, {bottom: insets.bottom + 8}]}>
			{GLASS ? (
				<GlassView isInteractive={true} style={styles.capsule}>
					<RadioMiniPlayer />
				</GlassView>
			) : (
				<View style={[styles.capsule, styles.card]}>
					<RadioMiniPlayer />
				</View>
			)}
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
	overlay: {
		position: 'absolute',
		left: 16,
		right: 16,
	},
	capsule: {
		borderRadius: 30,
		paddingVertical: 6,
		paddingHorizontal: 4,
	},
	card: {
		backgroundColor: c.secondarySystemGroupedBackground,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: c.separator,
		shadowColor: c.black,
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: {width: 0, height: 4},
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
	},
	// The Pressable, not the view inside it, has to take the spare width, or
	// only the drawn icon and text would answer a tap.
	stationContainer: {
		flex: 1,
	},
	station: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 44,
		paddingHorizontal: 8,
	},
	titles: {
		flex: 1,
		marginLeft: 12,
	},
	name: {
		color: c.label,
		fontSize: 15,
		fontWeight: '600',
	},
	status: {
		color: c.secondaryLabel,
		fontSize: 13,
	},
	control: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
