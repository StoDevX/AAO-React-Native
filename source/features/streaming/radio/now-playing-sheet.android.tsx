import * as React from 'react'
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Host, Icon, IconButton} from '@expo/ui/jetpack-compose'
import tinycolor from 'tinycolor2'

import {FullScheduleSheet} from './full-schedule-sheet'
import {FullLayout, StationMenu, useLogoCycle} from './player-view'
import {palette} from './player-view/palette'
import {STATIONS} from './stations'
import {useRadioStore} from './store'
import arrowBackIcon from '@expo/material-symbols/arrow_back.xml'

/** How much darker the page's foot is than its head, as the iOS sheet's gradient. */
const FOOT_DARKENING = 12

/**
 * The radio's player on Android: a full screen of its own, opened from either
 * Now Playing bar, as Android's media apps open their player -- not a sheet
 * presented over the screen, with the schedule as another sheet over that.
 * Back (the gesture, or the app bar's arrow) closes it. It takes the current
 * logo's colour, as Material takes a player's colours from its artwork.
 */
export function RadioNowPlayingSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.sheetOpen)
	let viewed = useRadioStore((state) => state.viewedStationId)
	let closeSheet = useRadioStore((state) => state.closeSheet)
	let openFullSchedule = useRadioStore((state) => state.openFullSchedule)
	let station = STATIONS[viewed]
	let {logo, showNextLogo} = useLogoCycle(station)
	let insets = useSafeAreaInsets()
	let background = tinycolor(logo.tint)
		.darken(FOOT_DARKENING / 2)
		.toHexString()

	return (
		<Modal
			animationType="slide"
			navigationBarTranslucent={true}
			onRequestClose={closeSheet}
			statusBarTranslucent={true}
			visible={open}
		>
			<View style={[styles.page, {backgroundColor: background, paddingTop: insets.top}]}>
				<View style={styles.bar}>
					<Host matchContents={true}>
						<IconButton onClick={closeSheet}>
							<Icon contentDescription="Back" source={arrowBackIcon} tint={palette.primary} />
						</IconButton>
					</Host>
					<Text style={[styles.title, palette.styles.primary]}>Radio</Text>
					<StationMenu station={station} />
				</View>
				<ScrollView contentContainerStyle={{paddingBottom: insets.bottom}}>
					{/* The schedule opens as its own dialog on Android, and the page
					    scrolls rather than fitting itself, so these go unused. */}
					<FullLayout
						logo={logo}
						onToggleSchedule={openFullSchedule}
						showNextLogo={showNextLogo}
						showingSchedule={false}
						station={station}
						viewportHeight={0}
					/>
				</ScrollView>
				<FullScheduleSheet />
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
	bar: {height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 4},
	title: {flex: 1, fontSize: 22},
})
