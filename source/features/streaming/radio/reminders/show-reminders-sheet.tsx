import * as React from 'react'
import {Linking, StyleSheet} from 'react-native'
import {
	BottomSheet,
	Button,
	Group,
	HStack,
	Host,
	Image,
	List,
	Section,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	padding,
	presentationBackground,
	presentationDetents,
	presentationDragIndicator,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {showTitle} from '../../../telemetry/catalog'
import {track} from '../../../telemetry/track'
import {useRadioStore, type FollowedShow} from '../store'
import {remindersByStation} from './by-station'
import {bellLabel} from './follow-controls'
import {requestReminderPermission} from './notifications'
import {promptFor} from './prompt'
import {syncShowReminders} from './sync'

/** The sheet's side margins, which line its title up with the list's rows. */
const TITLE_INSET = 20

// The list is drawn on the grouped background, so the sheet takes it too,
// leaving no lighter band behind the title. `presentationBackground` is typed
// for a string, but its colour goes through the same conversion as `tint`'s,
// which takes a PlatformColor.
const SHEET_BACKGROUND = c.systemGroupedBackground as unknown as string

function stopReminding(show: FollowedShow): void {
	useRadioStore.getState().unfollow(show)
	track({
		name: 'radio.reminder.unfollow',
		anonymous: true,
		attributes: {station: show.stationId, title: showTitle(show.title), surface: 'reminders'},
	})
}

/**
 * A followed show, with a bell that stops its reminders. The bell is filled
 * only while reminders can arrive, as every other bell is; either way, a tap
 * removes the show, since everything listed here is followed.
 */
function FollowedShowRow({
	show,
	reminding,
}: {
	show: FollowedShow
	reminding: boolean
}): React.ReactNode {
	return (
		<HStack>
			<Text>{show.title}</Text>
			<Spacer />
			<Button
				modifiers={[
					buttonStyle('plain'),
					accessibilityLabel(bellLabel(show, true)),
					accessibilityIdentifier(`radio-reminders-bell-${show.title}`),
				]}
				onPress={() => stopReminding(show)}
			>
				<Image
					modifiers={[
						foregroundStyle(reminding ? c.systemBlue : c.secondaryLabel),
						frame({width: 44, height: 44, alignment: 'trailing'}),
						contentShape(shapes.rectangle()),
					]}
					systemName={reminding ? 'bell.fill' : 'bell'}
				/>
			</Button>
		</HStack>
	)
}

/** Asks iOS for notifications, or opens Settings once iOS will no longer ask. */
function turnOnReminders(prompt: 'ask' | 'settings'): void {
	if (prompt === 'settings') {
		void Linking.openSettings()
		return
	}
	void requestReminderPermission().then((permission) => {
		useRadioStore.getState().setReminderPermission(permission)
		return syncShowReminders()
	})
}

/**
 * Every show followed, under its station, stacked over the Now Playing sheet
 * as the full schedule is. A show off the air for a while has no bell to
 * unfollow it from, so this is where any follow can be seen and removed.
 */
export function ShowRemindersSheet(): React.ReactNode {
	let open = useRadioStore((state) => state.remindersOpen)
	let closeReminders = useRadioStore((state) => state.closeReminders)
	let follows = useRadioStore((state) => state.followedShows)
	let permission = useRadioStore((state) => state.reminderPermission)
	let groups = remindersByStation(follows)
	let prompt = permission === null ? null : promptFor(permission)

	return (
		<Host pointerEvents="none" style={styles.host}>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={(presented) => {
					if (!presented) {
						closeReminders()
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
					<VStack spacing={0}>
						<HStack modifiers={[padding({horizontal: TITLE_INSET, top: 20, bottom: 12})]}>
							<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>Notifications</Text>
							<Spacer />
							<Button
								modifiers={[
									buttonStyle('glass'),
									buttonBorderShape('circle'),
									accessibilityLabel('Close'),
								]}
								onPress={closeReminders}
							>
								<Image systemName="xmark" />
							</Button>
						</HStack>
						{groups.length === 0 ? (
							<VStack modifiers={[padding({all: TITLE_INSET})]}>
								<Spacer />
								<Text
									modifiers={[foregroundStyle(c.secondaryLabel), multilineTextAlignment('center')]}
								>
									Tap the bell beside a show to be reminded a minute before it starts, every week.
								</Text>
								<Spacer />
							</VStack>
						) : (
							<List>
								{prompt === null ? null : (
									<Section
										footer={<Text>These shows won’t remind you until notifications are on.</Text>}
									>
										<Button
											label={prompt === 'ask' ? 'Allow Notifications' : 'Turn On in Settings'}
											onPress={() => turnOnReminders(prompt)}
										/>
									</Section>
								)}
								{groups.map(({station, shows}) => (
									<Section key={station.id} title={station.stationName}>
										<List.ForEach
											data={shows}
											keyExtractor={(show) => show.title}
											onDelete={(indices) => {
												for (let index of indices) {
													stopReminding(shows[index])
												}
											}}
										>
											{({item}) => (
												<FollowedShowRow reminding={permission === 'granted'} show={item} />
											)}
										</List.ForEach>
									</Section>
								))}
							</List>
						)}
					</VStack>
				</Group>
			</BottomSheet>
		</Host>
	)
}

const styles = StyleSheet.create({
	// Nothing to see or touch until the sheet is presented.
	host: {position: 'absolute', width: 0, height: 0},
})
