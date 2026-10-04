import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {BottomSheet, Group, Host, Rectangle, RNHostView, ZStack} from '@expo/ui/swift-ui'
import {
	foregroundStyle,
	ignoreSafeArea,
	presentationCornerRadius,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'

import {FullScheduleSheet} from './full-schedule-sheet'
import {FullLayout, tintGradient, useFitOrScroll, useLogoCycle} from './player-view'
import {prefetchImages} from '../../../lib/remote-images'
import {STATIONS, stationImageUrls} from './stations'
import {useRadioStore} from './store'

/**
 * The sheet's corner radius, which is one value for all four corners. The
 * system's is larger than an iPhone's own display corner, so the sheet's
 * bottom corners showed the screen behind them in the gap. A radius under
 * the display's, which runs from about 41pt on an iPhone 11 up, puts that gap
 * outside the display, so the bottom looks flush with the phone.
 */
const SHEET_CORNER_RADIUS = 38

/**
 * The radio's sheet, opened from either Now Playing bar: Music's full player,
 * full height, on the current logo's tint.
 */
export function RadioNowPlayingSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.sheetOpen)
	let viewed = useRadioStore((state) => state.viewedStationId)
	let closeSheet = useRadioStore((state) => state.closeSheet)
	let [showingSchedule, setShowingSchedule] = React.useState(false)
	let station = STATIONS[viewed]
	let {logo, showNextLogo} = useLogoCycle(station)
	let fit = useFitOrScroll()

	// The logos are fetched from the server rather than bundled, so opening the
	// sheet starts fetching them: the station on show first, then the one the
	// picker offers beside it.
	React.useEffect(() => {
		if (open) {
			let others = Object.values(STATIONS).filter((other) => other !== station)
			prefetchImages([station, ...others].flatMap(stationImageUrls))
		}
	}, [open, station])

	return (
		// Presented in its own window, so the Host needs no size and lets every
		// touch through to the screen beneath, as the map's sheet does.
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={(presented) => {
					if (!presented) {
						closeSheet()
					}
				}}
				// After the slide, not before it, so the record does not replace the
				// schedule while the sheet is still on screen.
				onDismiss={() => {
					setShowingSchedule(false)
				}}
			>
				<Group
					modifiers={[
						presentationDetents(['large']),
						presentationCornerRadius(SHEET_CORNER_RADIUS),
						presentationDragIndicator('visible'),
					]}
				>
					<ZStack>
						{/* The tint fills the sheet, safe area and all. */}
						<Rectangle modifiers={[foregroundStyle(tintGradient(logo)), ignoreSafeArea()]} />
						{/* React Native lays the player out, at the sheet's own size. */}
						<RNHostView>
							<ScrollView
								contentContainerStyle={styles.content}
								onContentSizeChange={fit.onContentSizeChange}
								onLayout={fit.onLayout}
								scrollEnabled={fit.scrollEnabled}
							>
								<FullLayout
									logo={logo}
									onToggleSchedule={() => setShowingSchedule((on) => !on)}
									viewportHeight={fit.viewport}
									showNextLogo={showNextLogo}
									showingSchedule={showingSchedule}
									station={station}
								/>
								<FullScheduleSheet />
							</ScrollView>
						</RNHostView>
					</ZStack>
				</Group>
			</BottomSheet>
		</Host>
	)
}

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
	},
})
