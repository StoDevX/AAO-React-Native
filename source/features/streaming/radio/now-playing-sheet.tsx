import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {BottomSheet, Group, Host, Rectangle, RNHostView, ZStack} from '@expo/ui/swift-ui'
import {
	Animation,
	animation,
	foregroundStyle,
	ignoreSafeArea,
	opacity,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers'

import {
	CompactLayout,
	FullLayout,
	ON_FILL_PALETTE,
	PaletteContext,
	SYSTEM_PALETTE,
	tintGradient,
	useLogoCycle,
} from './player-view'
import {STATIONS} from './stations'
import {useRadioStore} from './store'

/**
 * The radio's sheet, opened from either Now Playing bar. Glass at the medium
 * detent -- the one sheet in the app that is, because the station's record and
 * colour give it something to show -- and filled with the logo's tint at large.
 */
export function RadioNowPlayingSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.sheetOpen)
	let viewed = useRadioStore((state) => state.viewedStationId)
	let closeSheet = useRadioStore((state) => state.closeSheet)
	let [detent, setDetent] = React.useState<PresentationDetent>('medium')
	let [showingSchedule, setShowingSchedule] = React.useState(false)
	let station = STATIONS[viewed]
	let {logo, showNextLogo} = useLogoCycle(station)
	let large = detent === 'large'

	return (
		// Presented in its own window, so the Host needs no size and lets every
		// touch through to the screen beneath, as the map's sheet does.
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={(presented) => {
					if (!presented) {
						closeSheet()
						setDetent('medium')
						setShowingSchedule(false)
					}
				}}
			>
				<Group
					modifiers={[
						presentationDetents(['medium', 'large'], {
							selection: detent,
							onSelectionChange: setDetent,
						}),
						presentationDragIndicator('visible'),
					]}
				>
					<ZStack>
						{/* The tint fills the sheet, safe area and all, once it is full
						    height; at medium the glass shows through. */}
						<Rectangle
							modifiers={[
								foregroundStyle(tintGradient(logo)),
								ignoreSafeArea(),
								opacity(large ? 1 : 0),
								animation(Animation.easeInOut({duration: 0.3}), large),
							]}
						/>
						{/* React Native lays the player out, at the sheet's own size. */}
						<RNHostView>
							{/* Scrolls when large text or a small phone needs more room than
							    the detent gives; otherwise it fits and stays put. */}
							<ScrollView contentContainerStyle={styles.content}>
								<PaletteContext.Provider value={large ? ON_FILL_PALETTE : SYSTEM_PALETTE}>
									{large ? (
										<FullLayout
											logo={logo}
											onToggleSchedule={() => setShowingSchedule((on) => !on)}
											showNextLogo={showNextLogo}
											showingSchedule={showingSchedule}
											station={station}
										/>
									) : (
										<CompactLayout
											logo={logo}
											onShowSchedule={() => {
												// The medium detent has no room for the list, so it opens full height.
												setShowingSchedule(true)
												setDetent('large')
											}}
											station={station}
										/>
									)}
								</PaletteContext.Provider>
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
