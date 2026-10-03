import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {
	BottomSheet,
	Button,
	Group,
	HStack,
	Host,
	Image,
	RNHostView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	font,
	padding,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'
import {useRouter} from 'expo-router'
import {scheduleCalendarOptions, ScheduleView} from '@frogpond/ccc-calendar'
import {eventKey} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'

import {eventMapper} from './constants'
import {STATIONS} from './stations'
import {useRadioStore} from './store'

/** The sheet's side margins, which line its title up with the schedule's rows. */
const TITLE_INSET = 20

/**
 * The viewed station's full schedule, stacked over the Now Playing sheet as the
 * website is, so closing it returns to the player. It is a sheet of its own,
 * not a screen, because the Now Playing sheet is in a window above every screen.
 */
export function FullScheduleSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.fullScheduleOpen)
	let closeFullSchedule = useRadioStore((state) => state.closeFullSchedule)
	let closeSheet = useRadioStore((state) => state.closeSheet)
	let station = STATIONS[useRadioStore((state) => state.viewedStationId)]
	let calendar = station.scheduleHref === '/ksto-schedule' ? 'ksto-schedule' : 'krlx-schedule'
	let query = useQuery({...scheduleCalendarOptions(calendar, {eventMapper}), enabled: open})
	let router = useRouter()

	// An event's page is a screen, which opens beneath both sheets, so they
	// go to let it be seen.
	let onPressEvent = React.useCallback(
		(event: EventType) => {
			closeSheet()
			router.navigate({
				pathname: '/calendar/event',
				params: {source: calendar, eventKey: eventKey(event)},
			})
		},
		[calendar, closeSheet, router],
	)

	return (
		<Host pointerEvents="none" style={styles.host}>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={(presented) => {
					if (!presented) {
						closeFullSchedule()
					}
				}}
			>
				<Group modifiers={[presentationDetents(['large']), presentationDragIndicator('visible')]}>
					<VStack spacing={0}>
						<HStack modifiers={[padding({horizontal: TITLE_INSET, top: 20, bottom: 12})]}>
							<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>
								{`${station.stationName} Schedule`}
							</Text>
							<Spacer />
							<Button
								modifiers={[
									buttonStyle('glass'),
									buttonBorderShape('circle'),
									accessibilityLabel('Close'),
								]}
								onPress={closeFullSchedule}
							>
								<Image systemName="xmark" />
							</Button>
						</HStack>
						<RNHostView>
							<View style={styles.list}>
								<ScheduleView onPressEvent={onPressEvent} query={query} />
							</View>
						</RNHostView>
					</VStack>
				</Group>
			</BottomSheet>
		</Host>
	)
}

const styles = StyleSheet.create({
	// Nothing to see or touch until the sheet is presented.
	host: {position: 'absolute', width: 0, height: 0},
	list: {flex: 1},
})
