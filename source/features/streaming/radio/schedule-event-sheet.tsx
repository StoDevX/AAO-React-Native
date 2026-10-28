import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {
	BottomSheet,
	Button,
	Group,
	HStack,
	Image,
	RNHostView,
	Spacer,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	disabled as disabledModifier,
	padding,
	presentationBackground,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import * as c from '@frogpond/colors'
import {EventDetail, shareEvent} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'

import {addToCalendarEvents} from '../../telemetry/calendar-events'
import {track} from '../../telemetry/track'
import {KRLX_POWERED_BY, KSTO_POWERED_BY} from './constants'
import {FollowButton, ReminderPermissionSheet, useFollowToggle} from './reminders'
import type {Station} from './stations'

const HEADER_INSET = 20

// The event's body is drawn on the grouped background, so the sheet takes it
// too, leaving no lighter band behind the buttons above and below it.
// `presentationBackground` is typed for a string, but its colour goes through
// the same conversion as `tint`'s, which takes a PlatformColor.
const SHEET_BACKGROUND = c.systemGroupedBackground as unknown as string

/**
 * A show from a station's full schedule, stacked over that schedule. It draws
 * the event page's body with its Share and Add to Calendar actions, which that
 * page keeps in a navigation bar the sheet has no room for.
 */
export function ScheduleEventSheet({
	event,
	isPresented,
	onClose,
	station,
}: {
	event: EventType | null
	isPresented: boolean
	onClose: () => void
	station: Station
}): React.ReactNode {
	let {toggle, prompt, confirmPrompt, dismissPrompt} = useFollowToggle('show_sheet')
	return (
		<BottomSheet
			isPresented={isPresented}
			onIsPresentedChange={(presented) => {
				if (!presented) {
					onClose()
				}
			}}
		>
			<Group
				modifiers={[
					presentationDetents(['large']),
					presentationDragIndicator('visible'),
					presentationBackground(SHEET_BACKGROUND),
				]}
			>
				{event === null ? null : (
					<VStack spacing={0}>
						<HStack modifiers={[padding({horizontal: HEADER_INSET, top: 20, bottom: 12})]}>
							<Button
								modifiers={[
									buttonStyle('glass'),
									buttonBorderShape('circle'),
									accessibilityLabel('Close'),
								]}
								onPress={onClose}
							>
								<Image systemName="xmark" />
							</Button>
							<Spacer />
							<Button
								modifiers={[
									buttonStyle('glass'),
									buttonBorderShape('circle'),
									accessibilityLabel('Share Event'),
								]}
								onPress={() => shareEvent(event)}
							>
								<Image systemName="square.and.arrow.up" />
							</Button>
						</HStack>
						<RNHostView>
							<View style={styles.detail}>
								<EventDetail.EventDetail
									color={c.systemBlue}
									event={event}
									poweredBy={station.id === 'ksto' ? KSTO_POWERED_BY : KRLX_POWERED_BY}
								/>
							</View>
						</RNHostView>
						<FollowButton onToggle={toggle} show={{stationId: station.id, title: event.title}} />
						<AddToCalendar
							compactMessages={true}
							event={event}
							onResult={(result) => {
								for (let telemetryEvent of addToCalendarEvents(
									result,
									`${station.id}-schedule`,
									event,
								)) {
									track(telemetryEvent)
								}
							}}
							render={({message, disabled, onPress}) => (
								<Button
									label={message || 'Add to Calendar'}
									modifiers={[
										buttonStyle('glassProminent'),
										disabledModifier(disabled),
										padding({all: HEADER_INSET}),
									]}
									onPress={onPress}
								/>
							)}
						/>
					</VStack>
				)}
				<ReminderPermissionSheet
					onClose={dismissPrompt}
					onConfirm={confirmPrompt}
					prompt={prompt}
				/>
			</Group>
		</BottomSheet>
	)
}

const styles = StyleSheet.create({
	detail: {flex: 1},
})
