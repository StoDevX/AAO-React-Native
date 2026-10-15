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

import {resolvePanel, selectPanel, useCaptionsAvailability, type Panel} from './captions'
import {RadioDevSettingsSheet} from './dev-settings/dev-settings-sheet'
import {FullScheduleSheet} from './full-schedule-sheet'
import {FullLayout, tintGradient, useFitOrScroll, useLogoCycle} from './player-view'
import {STATIONS} from './stations'
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
	let captionsOn = useRadioStore((state) => state.captionsOn)
	let setCaptionsOn = useRadioStore((state) => state.setCaptionsOn)
	let station = STATIONS[viewed]
	// The panel the viewer picked since the sheet opened; until they pick one, it
	// opens on the captions if they left those selected.
	let [chosen, setChosen] = React.useState<Panel | null>(null)
	let availability = useCaptionsAvailability(station)
	let panel = resolvePanel({chosen, captionsOn, availability})
	let onSelectPanel = (pressed: 'schedule' | 'captions') => {
		let next = selectPanel(panel, pressed)
		setChosen(next)
		setCaptionsOn(next === 'captions')
	}
	let {logo, showNextLogo} = useLogoCycle(station)
	let fit = useFitOrScroll()

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
					setChosen(null)
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
									onSelectPanel={onSelectPanel}
									panel={panel}
									viewportHeight={fit.viewport}
									showNextLogo={showNextLogo}
									station={station}
								/>
								<FullScheduleSheet />
								<RadioDevSettingsSheet />
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
