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
import type {Station} from './stations'

const HEADER_INSET = 20

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
	return (
		<BottomSheet
			isPresented={isPresented}
			onIsPresentedChange={(presented) => {
				if (!presented) {
					onClose()
				}
			}}
		>
			<Group modifiers={[presentationDetents(['large']), presentationDragIndicator('visible')]}>
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
			</Group>
		</BottomSheet>
	)
}

const styles = StyleSheet.create({
	detail: {flex: 1},
})
