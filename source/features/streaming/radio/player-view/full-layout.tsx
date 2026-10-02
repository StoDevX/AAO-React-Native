import * as React from 'react'
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native'

import {ScratchableLogo} from '../scratchable-logo'
import type {Station} from '../stations'
import {useStationPlayback} from '../store'
import {PlaybackError, PlayStopButton} from './play-stop-button'
import {ScheduleList} from './schedule-list'
import {ShowTitle} from './show-title'
import {StationActionRow, StationMenu} from './station-actions'
import {StationPicker} from './station-picker'
import {VolumeSliderStub} from './stubs'
import {usePalette} from './palette'
import type {RadioLogo} from '../theme'

/** The player's inset from each side, as Music's full player. */
export const SIDE = 28

/** Music's full player for a live station, with the record where the album art goes. */
export function FullLayout({
	station,
	logo,
	showNextLogo,
}: {
	station: Station
	logo: RadioLogo
	showNextLogo?: () => void
}): React.ReactNode {
	let {playState} = useStationPlayback(station.id)
	let [showingSchedule, setShowingSchedule] = React.useState(false)
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
						onTap={showNextLogo}
						playing={playState === 'playing'}
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
			<StationActionRow onShowSchedule={() => setShowingSchedule((on) => !on)} station={station} />
		</View>
	)
}

/** Music's "LIVE" in place of a scrubber: a stream has no position to show. */
function LiveBar(): React.ReactNode {
	let palette = usePalette()
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
