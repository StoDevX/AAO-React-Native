import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Divider, Host, ScrollView, Text, useNativeState, VStack} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	id,
	onAppear,
	padding,
	refreshable,
	scrollPosition,
	scrollTargetLayout,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {FilterToolbar} from '@frogpond/filter'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {now} from '@frogpond/timer'
import * as c from '@frogpond/colors'

import {DebugDatePicker} from '../source/features/athletics/debug-date-picker'
import {EmptyListNotice} from '../source/features/athletics/empty-notice'
import {athleticsOptions} from '../source/features/athletics/query'
import {AthleticsRow} from '../source/features/athletics/row'
import {sportsFilter} from '../source/features/athletics/sports-filter'
import {useFilterStore} from '../source/features/athletics/store'
import type {DaySection, ProcessedScore} from '../source/features/athletics/types'
import {daySections, filterBySport} from '../source/features/athletics/utils'

// Stable so a pending query's default `[]` doesn't invalidate the memos and
// effect below on every render.
const NO_SCORES: ProcessedScore[] = []

const HEADER_MODIFIERS = [
	font({textStyle: 'title3', weight: 'semibold'}),
	foregroundStyle(c.secondaryLabel),
	frame({maxWidth: Infinity, alignment: 'leading'}),
	padding({horizontal: 20}),
]
const CARD_MODIFIERS = [
	background(c.secondarySystemGroupedBackground, shapes.roundedRectangle({cornerRadius: 26})),
	padding({horizontal: 16}),
]
const ROW_MODIFIERS = [padding({horizontal: 16, vertical: 12})]
const DIVIDER_MODIFIERS = [padding({leading: 16})]
const QUIET_ROW_MODIFIERS = [
	foregroundStyle(c.secondaryLabel),
	frame({maxWidth: Infinity, alignment: 'leading'}),
	...ROW_MODIFIERS,
]

type DayProps = {
	section: DaySection
	/** Fires as the section first appears, for the list to scroll Today into place. */
	onAppearToday?: () => void
}

/** A day's header over a grouped card of its games. */
function Day({section, onAppearToday}: DayProps): React.ReactNode {
	return (
		<VStack
			// The id goes last: a modifier outside it keeps its identity across a
			// new debug date, so `onAppear` would not fire again.
			modifiers={[...(onAppearToday ? [onAppear(onAppearToday)] : []), id(section.key)]}
			spacing={8}
		>
			<Text modifiers={HEADER_MODIFIERS}>{section.title}</Text>
			<VStack modifiers={CARD_MODIFIERS} spacing={0}>
				{section.data.length === 0 ? (
					<Text modifiers={QUIET_ROW_MODIFIERS}>No games today</Text>
				) : (
					section.data.map((score, index) => (
						<VStack key={score.id} spacing={0}>
							{index > 0 ? <Divider modifiers={DIVIDER_MODIFIERS} /> : null}
							<VStack modifiers={ROW_MODIFIERS}>
								<AthleticsRow score={score} />
							</VStack>
						</VStack>
					))
				)}
			</VStack>
		</VStack>
	)
}

type ScoreListProps = {
	sections: DaySection[]
	onRefresh: () => Promise<unknown>
}

/**
 * Every day's games in one list, opened at Today: the days before sit above,
 * a scroll up away, and the days after below.
 *
 * A `ScrollView` over a stack rather than a `List`, drawn to look like an
 * inset grouped one: SwiftUI's `scrollPosition(id:)` names its targets through
 * the `scrollTargetLayout()` stack it scrolls, which a `List` does not have, so
 * on a `List` it is set and silently ignored and the list opens at its top.
 */
function ScoreList({sections, onRefresh}: ScoreListProps): React.ReactNode {
	let scrollTarget = useNativeState<string | null>(null)
	let scrollToToday = React.useCallback(
		(key: string) => () => scrollTarget.set(key),
		[scrollTarget],
	)

	return (
		<Host style={styles.host}>
			<ScrollView
				modifiers={[
					scrollPosition(scrollTarget, {anchor: 'top'}),
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				{/* Every child carries an id, as `scrollTargetLayout` asks: one it cannot
				    name reports itself as nil to the binding `scrollPosition` reads. */}
				<VStack modifiers={[scrollTargetLayout(), padding({vertical: 16})]} spacing={24}>
					{sections.map((section) => (
						<Day
							key={section.key}
							onAppearToday={section.isToday ? scrollToToday(section.key) : undefined}
							section={section}
						/>
					))}
				</VStack>
			</ScrollView>
		</Host>
	)
}

function AthleticsView(): React.ReactNode {
	const [debugDate, setDebugDate] = React.useState<Date | null>(null)
	const selectedSports = useFilterStore((s) => s.selectedSports)
	const setSelectedSports = useFilterStore((s) => s.setSelectedSports)
	const setAvailableSports = useFilterStore((s) => s.setAvailableSports)

	const {data = NO_SCORES, error, refetch, isLoading, isError} = useQuery(athleticsOptions)

	// The day the list is laid out around. Held steady between renders so the
	// grouping below doesn't re-run against a clock that has moved on.
	// `now()` rather than `new Date()`: under UI testing it answers the frozen
	// date the fixtures are written around, so which games count as today does
	// not depend on the day the suite happens to run.
	const today = React.useMemo(() => debugDate ?? now().toDate(), [debugDate])

	const filter = React.useMemo(() => sportsFilter(data, selectedSports), [data, selectedSports])

	// Keep availableSports in sync so the filter-hint selector can compare membership
	React.useEffect(() => {
		setAvailableSports(filter.spec.options.map((option) => option.title))
	}, [filter, setAvailableSports])

	const filtered = React.useMemo(() => filterBySport(data, selectedSports), [data, selectedSports])
	const sections = React.useMemo(() => daySections(filtered, today), [filtered, today])

	// The picker is bound to component state, so like Dictionary's search bar it
	// renders here rather than in the page wrapper, and in every branch below.
	const datePicker = (
		<DebugDatePicker onDateChange={setDebugDate} onReset={() => setDebugDate(null)} value={today} />
	)

	if (isError) {
		return (
			<>
				{datePicker}
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				{datePicker}
				<LoadingView />
			</>
		)
	}

	if (data.length === 0) {
		return (
			<>
				{datePicker}
				<NoticeView systemImage="sportscourt" title="No Scores" />
			</>
		)
	}

	return (
		<>
			{datePicker}
			<FilterToolbar
				filters={[filter]}
				onChange={(changed) => {
					// The sports list is the only filter this toolbar carries.
					if (changed.type !== 'list') {
						return
					}
					setSelectedSports(changed.spec.selected.map((option) => option.title))
				}}
			/>
			{filtered.length === 0 ? (
				<EmptyListNotice />
			) : (
				// Keyed on the day so a new debug date lays the list out afresh and
				// scrolls back to its Today.
				<ScoreList key={today.toDateString()} onRefresh={refetch} sections={sections} />
			)}
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function AthleticsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Athletics</Stack.Title>
			<AthleticsView />
		</>
	)
}
