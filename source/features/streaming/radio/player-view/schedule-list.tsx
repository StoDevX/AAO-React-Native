import * as React from 'react'
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {EventType} from '@frogpond/event-type'
import {formatCompactTime} from '@frogpond/time-format'

import {bellLabel, HostedReminderPermissionSheet, useFollowToggle} from '../reminders'
import type {Station} from '../stations'
import {useIsFollowing, useRadioStore, type FollowedShow} from '../store'
import {palette} from './palette'
import {scheduleNote, type ScheduleStatus} from './schedule-note'

/** How far a control dims under a finger, as the player's other controls do. */
const PRESSED_OPACITY = 0.3

/** What UI tests find a show's bell by, after the show's title. */
export const BELL_ID_PREFIX = 'radio-schedule-bell-'

/** Follows or unfollows a show, saying which it will do. */
function ReminderBell({
	show,
	onToggle,
}: {
	show: FollowedShow
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	let following = useIsFollowing(show)
	return (
		<Pressable
			accessibilityLabel={bellLabel(show, following)}
			accessibilityRole="button"
			hitSlop={8}
			onPress={() => onToggle(show)}
			style={styles.bell}
			testID={`${BELL_ID_PREFIX}${show.title}`}
		>
			{({pressed}) => (
				<View style={pressed ? styles.pressed : undefined}>
					<SymbolView
						name={following ? 'bell.fill' : 'bell'}
						size={20}
						tintColor={following ? palette.primary : palette.secondary}
					/>
				</View>
			)}
		</Pressable>
	)
}

const ScheduleRow = React.memo(function ScheduleRow({
	show,
	station,
	onPress,
	onToggle,
}: {
	show: EventType
	station: Station
	onPress: (show: EventType) => void
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	return (
		<View style={styles.row}>
			<Pressable
				accessibilityRole="button"
				onPress={() => onPress(show)}
				style={({pressed}) => [styles.rowText, pressed && styles.pressed]}
			>
				<Text style={[styles.time, palette.styles.secondary]}>
					{formatCompactTime(show.startTime)}
				</Text>
				<Text numberOfLines={1} style={[styles.title, palette.styles.primary]}>
					{show.title}
				</Text>
			</Pressable>
			<ReminderBell onToggle={onToggle} show={{stationId: station.id, title: show.title}} />
		</View>
	)
})

function showKey(show: EventType): string {
	return `${show.startTime.valueOf()}|${show.title}`
}

function Separator(): React.ReactNode {
	return <View style={[styles.separator, palette.styles.track]} />
}

/** Opens the station's whole week, which the player otherwise offers only from its menu. */
function FullScheduleLink(): React.ReactNode {
	let openFullSchedule = useRadioStore((state) => state.openFullSchedule)
	return (
		<Pressable
			accessibilityRole="button"
			onPress={openFullSchedule}
			style={({pressed}) => [styles.link, pressed && styles.pressed]}
			testID="radio-full-schedule-link"
		>
			<Text style={[styles.linkText, palette.styles.primary]}>Full Schedule</Text>
		</Pressable>
	)
}

/**
 * The rest of today's shows, or why there are none, with a bell on each to be
 * reminded of it every week. It fills the record's place and scrolls, as a
 * day can hold more shows than the record is tall.
 */
export function ScheduleList({
	upcoming,
	status,
	station,
	onPressShow,
}: {
	upcoming: readonly EventType[]
	status: ScheduleStatus
	station: Station
	onPressShow: (show: EventType) => void
}): React.ReactNode {
	let {toggle, prompt, confirmPrompt, dismissPrompt} = useFollowToggle()
	let note = scheduleNote(status, upcoming.length)

	let renderShow = React.useCallback(
		({item}: {item: EventType}) => (
			<ScheduleRow onPress={onPressShow} onToggle={toggle} show={item} station={station} />
		),
		[onPressShow, toggle, station],
	)

	return (
		<>
			{note ? (
				<View style={styles.noteBox}>
					<Text style={[styles.note, palette.styles.secondary]}>{note}</Text>
					<FullScheduleLink />
				</View>
			) : (
				<FlatList
					ItemSeparatorComponent={Separator}
					ListFooterComponent={FullScheduleLink}
					data={upcoming}
					keyExtractor={showKey}
					renderItem={renderShow}
					style={styles.list}
					testID="radio-schedule-list"
				/>
			)}
			<HostedReminderPermissionSheet
				onClose={dismissPrompt}
				onConfirm={confirmPrompt}
				prompt={prompt}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	// The record's place has a fixed height, so the list takes it and scrolls
	// within it rather than growing past it.
	list: {alignSelf: 'stretch', flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', minHeight: 44},
	rowText: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44},
	time: {fontSize: 17, width: 80, fontVariant: ['tabular-nums']},
	title: {fontSize: 17, flex: 1},
	bell: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
	// Inset to the title, as a list's hairlines are.
	separator: {height: StyleSheet.hairlineWidth, marginLeft: 92},
	link: {minHeight: 44, justifyContent: 'center', alignSelf: 'center'},
	linkText: {fontSize: 17, fontWeight: '600'},
	noteBox: {alignItems: 'center', gap: 8},
	note: {fontSize: 17, textAlign: 'center'},
	pressed: {opacity: PRESSED_OPACITY},
})
