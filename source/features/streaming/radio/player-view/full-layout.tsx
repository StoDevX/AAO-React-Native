import * as React from 'react'
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {Host, Rectangle, RNHostView, VStack, ZStack} from '@expo/ui/swift-ui'
import {Animation, animation, foregroundStyle, opacity, padding} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import tinycolor from 'tinycolor2'

import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ScheduleList} from './schedule-list'
import {ShowTitle} from './show-title'
import {StationActionRow, StationMenu} from './station-actions'
import {StationPicker} from './station-picker'
import {VolumeSliderStub} from './stubs'
import {useLogoCycle} from './use-logo-cycle'

/** The player's inset from each side, as Music's full player. */
export const SIDE = 28

/** The fill for a logo without a tint of its own. Every station's logos have one today. */
const UNTINTED = '#48484a'

/** How much darker the bottom of the fill is than the logo's tint. */
const FILL_DARKENING = 25

/** Music's full player for a live station, with the record where the album art goes. */
export function FullLayout({
	station,
	filled,
}: {
	station: Station
	filled: boolean
}): React.ReactNode {
	let {logo, showNextLogo} = useLogoCycle(station)
	let {playState} = useStationPlayback(station.id)
	let [showingSchedule, setShowingSchedule] = React.useState(false)
	let {width} = useWindowDimensions()
	let artwork = width - 2 * SIDE

	let tint = logo.theme.tintColor ?? UNTINTED
	let fill = {
		type: 'linearGradient' as const,
		colors: [tint, tinycolor(tint).darken(FILL_DARKENING).toHexString()],
		startPoint: {x: 0.5, y: 0},
		endPoint: {x: 0.5, y: 1},
	}

	return (
		<Host style={styles.fill}>
			<ZStack>
				{/* The fill fades in once the sheet is full height, and is always
				    there on the Radio tab; at the medium detent the sheet's glass
				    shows through instead. */}
				<Rectangle
					modifiers={[
						foregroundStyle(fill),
						opacity(filled ? 1 : 0),
						animation(Animation.easeInOut({duration: 0.3}), filled),
					]}
				/>
				<VStack modifiers={[padding({horizontal: SIDE, top: 12})]} spacing={20}>
					<StationPicker />
					<RNHostView matchContents={true}>
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
									onTap={showNextLogo}
									playing={playState === 'playing'}
									size={artwork}
								/>
							)}
						</View>
					</RNHostView>
					<RNHostView matchContents={true}>
						<View style={styles.stack}>
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
							<StationActionRow
								onShowSchedule={() => setShowingSchedule((on) => !on)}
								station={station}
							/>
						</View>
					</RNHostView>
				</VStack>
			</ZStack>
		</Host>
	)
}

/** Music's "LIVE" in place of a scrubber: a stream has no position to show. */
function LiveBar(): React.ReactNode {
	return (
		<View accessibilityLabel="Live" accessible={true} style={styles.live}>
			<View style={styles.track} />
			<Text style={styles.liveText}>LIVE</Text>
			<View style={styles.track} />
		</View>
	)
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	artwork: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	stack: {
		gap: 24,
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
		backgroundColor: c.tertiarySystemFill,
	},
	liveText: {
		color: c.secondaryLabel,
		fontSize: 13,
		fontWeight: '600',
	},
})
