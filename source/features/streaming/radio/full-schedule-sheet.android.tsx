import * as React from 'react'
import {Modal, StyleSheet, View} from 'react-native'
import {Button, Host, Icon, IconButton, Row, Text as ComposeText} from '@expo/ui/jetpack-compose'
import {fillMaxWidth, padding, weight} from '@expo/ui/jetpack-compose/modifiers'
import {ScheduleView} from '@frogpond/ccc-calendar'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import * as c from '@frogpond/colors'
import {EventDetail, shareEvent} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import {useQuery} from '@tanstack/react-query'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {addToCalendarEvents} from '../../telemetry/calendar-events'
import {track} from '../../telemetry/track'
import {KRLX_POWERED_BY, KSTO_POWERED_BY} from './constants'
import {FollowBell, HostedReminderPermissionSheet, useFollowToggle} from './reminders'
import {STATIONS, type Station} from './stations'
import {useRadioStore} from './store'
import {stationScheduleOptions} from './use-station-schedule'
import arrowBackIcon from '@expo/material-symbols/arrow_back.xml'
import closeIcon from '@expo/material-symbols/close.xml'
import shareIcon from '@expo/material-symbols/share.xml'

/**
 * The viewed station's full schedule on Android: a Material full-screen
 * dialog over the Now Playing sheet, rather than a second sheet stacked on
 * it, which Material advises against. Close is at its leading edge. A show
 * opens in the same dialog, with Back to the schedule, rather than in a third
 * sheet; Back steps from the show to the schedule, then closes the dialog.
 */
export function FullScheduleSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.fullScheduleOpen)
	let closeFullSchedule = useRadioStore((state) => state.closeFullSchedule)
	let station = STATIONS[useRadioStore((state) => state.viewedStationId)]
	let options = stationScheduleOptions(station.schedule)
	let query = useQuery({...options, enabled: open && options.enabled})
	let [event, setEvent] = React.useState<EventType | null>(null)

	let close = () => {
		setEvent(null)
		closeFullSchedule()
	}
	let back = () => (event ? setEvent(null) : close())
	let {toggle, prompt, confirmPrompt, dismissPrompt} = useFollowToggle('full_schedule')
	let bell = React.useCallback(
		(shown: EventType) => (
			<FollowBell onToggle={toggle} show={{stationId: station.id, title: shown.title}} />
		),
		[toggle, station.id],
	)
	let insets = useSafeAreaInsets()

	return (
		<Modal animationType="slide" onRequestClose={back} statusBarTranslucent={true} visible={open}>
			<View style={[styles.page, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
				<AppBar
					action={
						event ? (
							<IconButton onClick={() => shareEvent(event)}>
								<Icon contentDescription="Share event" source={shareIcon} />
							</IconButton>
						) : null
					}
					navigation={
						<IconButton onClick={back}>
							<Icon
								contentDescription={event ? 'Back' : 'Close'}
								source={event ? arrowBackIcon : closeIcon}
							/>
						</IconButton>
					}
					title={event ? '' : `${station.stationName} schedule`}
				/>
				{event ? (
					<EventPage event={event} station={station} />
				) : (
					<View style={styles.fill}>
						<ScheduleView onPressEvent={setEvent} query={query} rowAccessory={bell} />
					</View>
				)}
				<HostedReminderPermissionSheet
					onClose={dismissPrompt}
					onConfirm={confirmPrompt}
					prompt={prompt}
				/>
			</View>
		</Modal>
	)
}

/** A Material top app bar: navigation icon, title at the start, an action at the end. */
function AppBar({
	navigation,
	title,
	action,
}: {
	navigation: React.ReactNode
	title: string
	action: React.ReactNode
}): React.ReactNode {
	return (
		<Host matchContents={{vertical: true}} style={styles.bar}>
			<Row modifiers={[fillMaxWidth(), padding(4, 8, 4, 8)]} verticalAlignment="center">
				{navigation}
				<ComposeText modifiers={[weight(1)]} style={{typography: 'titleLarge'}}>
					{title}
				</ComposeText>
				{action}
			</Row>
		</Host>
	)
}

/** A show's page: the event page's body, and Add to Calendar as the page's button. */
function EventPage({event, station}: {event: EventType; station: Station}): React.ReactNode {
	return (
		<View style={styles.fill}>
			<View style={styles.fill}>
				<EventDetail.EventDetail
					color={c.systemBlue}
					event={event}
					poweredBy={station.id === 'ksto' ? KSTO_POWERED_BY : KRLX_POWERED_BY}
				/>
			</View>
			<AddToCalendar
				compactMessages={true}
				event={event}
				onResult={(result) => {
					for (let telemetryEvent of addToCalendarEvents(result, `${station.id}-schedule`, event)) {
						track(telemetryEvent)
					}
				}}
				render={({message, disabled, onPress}) => (
					<Host matchContents={{vertical: true}} style={styles.footer}>
						<Button enabled={!disabled} modifiers={[fillMaxWidth()]} onClick={onPress}>
							<ComposeText>{message || 'Add to calendar'}</ComposeText>
						</Button>
					</Host>
				)}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1, backgroundColor: c.systemBackground},
	bar: {width: '100%'},
	fill: {flex: 1},
	footer: {width: '100%', padding: 16},
})
