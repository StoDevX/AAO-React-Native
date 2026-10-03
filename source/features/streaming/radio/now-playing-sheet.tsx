import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {BottomSheet, Group, Host, Rectangle, RNHostView, ZStack} from '@expo/ui/swift-ui'
import {
	foregroundStyle,
	ignoreSafeArea,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'

import {FullLayout, tintGradient, useLogoCycle} from './player-view'
import {STATIONS} from './stations'
import {useRadioStore} from './store'

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
	// A scroll view takes every drag on it, so one that scrolled always would
	// stop the sheet being swiped away. It scrolls only when the player is
	// taller than the sheet, at large text sizes or on a small phone.
	let [viewport, setViewport] = React.useState(0)
	let [contentHeight, setContentHeight] = React.useState(0)
	let overflows = contentHeight > viewport

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
				onDismiss={() => setShowingSchedule(false)}
			>
				<Group modifiers={[presentationDetents(['large']), presentationDragIndicator('visible')]}>
					<ZStack>
						{/* The tint fills the sheet, safe area and all. */}
						<Rectangle modifiers={[foregroundStyle(tintGradient(logo)), ignoreSafeArea()]} />
						{/* React Native lays the player out, at the sheet's own size. */}
						<RNHostView>
							<ScrollView
								contentContainerStyle={styles.content}
								onContentSizeChange={(_width, height) => setContentHeight(height)}
								onLayout={(event) => setViewport(event.nativeEvent.layout.height)}
								scrollEnabled={overflows}
							>
								<FullLayout
									logo={logo}
									onToggleSchedule={() => setShowingSchedule((on) => !on)}
									scratchable={false}
									showNextLogo={showNextLogo}
									showingSchedule={showingSchedule}
									station={station}
								/>
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
