import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-screens/experimental'
import {useNavigation} from 'expo-router'

import {
	FullLayout,
	TintFill,
	useFitOrScroll,
	useLogoCycle,
} from '../../source/features/streaming/radio/player-view'
import {STATIONS} from '../../source/features/streaming/radio/stations'
import {useRadioStore} from '../../source/features/streaming/radio/store'
import {useSwipeBackHold} from '../../source/features/streaming/radio/swipe-back-hold'

/** The radio, full-screen: the sheet's full layout, always on the tint fill. */
export default function RadioTab(): React.ReactNode {
	let viewed = useRadioStore((state) => state.viewedStationId)
	let station = STATIONS[viewed]
	let {logo, showNextLogo} = useLogoCycle(station)
	let [showingSchedule, setShowingSchedule] = React.useState(false)
	let [logoHeld, setLogoHeld] = React.useState(false)
	let fit = useFitOrScroll()

	// iOS 26 and later go back on a swipe from anywhere on the screen, which a
	// scratch would set off. The stack holding these tabs owns that gesture;
	// the left-edge swipe and the Back button still work.
	let navigation = useNavigation()
	let setSwipeBackEnabled = React.useCallback(
		(enabled: boolean) => navigation.getParent()?.setOptions({fullScreenGestureEnabled: enabled}),
		[navigation],
	)
	let {hold: holdSwipeBack, settle: settleSwipeBack} = useSwipeBackHold(setSwipeBackEnabled)

	// A new logo invites a scratch, so the swipe waits again.
	React.useEffect(() => {
		settleSwipeBack()
	}, [logo.name, settleSwipeBack])

	let handleLogoHeld = React.useCallback(
		(held: boolean) => {
			setLogoHeld(held)
			if (held) {
				holdSwipeBack()
			}
		},
		[holdSwipeBack],
	)

	return (
		<View style={styles.screen}>
			<TintFill logo={logo} />
			{/* Between the navigation bar and the tab bar, so the player is sized
			    to the room it can be seen in. */}
			<SafeAreaView edges={{top: true, bottom: true}} style={styles.screen}>
				<ScrollView
					contentContainerStyle={styles.content}
					contentInsetAdjustmentBehavior="never"
					onContentSizeChange={fit.onContentSizeChange}
					onLayout={fit.onLayout}
					scrollEnabled={fit.scrollEnabled && !logoHeld}
				>
					<FullLayout
						logo={logo}
						onLogoHeldChange={handleLogoHeld}
						onLogoSettle={settleSwipeBack}
						onToggleSchedule={() => setShowingSchedule((on) => !on)}
						scratchable={true}
						viewportHeight={fit.viewport}
						showNextLogo={showNextLogo}
						showingSchedule={showingSchedule}
						station={station}
					/>
				</ScrollView>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
	},
})
