import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {foregroundStyle, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {now} from '@frogpond/timer'
import * as c from '@frogpond/colors'

import {DebugDatePicker} from '../source/features/athletics/debug-date-picker'
import {EmptyListNotice} from '../source/features/athletics/empty-notice'
import {athleticsOptions} from '../source/features/athletics/query'
import {AthleticsRow} from '../source/features/athletics/row'
import {SportsMenu} from '../source/features/athletics/sports-menu'
import {useFilterStore} from '../source/features/athletics/store'
import type {DaySection, ProcessedScore} from '../source/features/athletics/types'
import {daySections, filterBySport, sportFilterSections} from '../source/features/athletics/utils'

// Stable so a pending query's default `[]` doesn't invalidate the memos and
// effect below on every render.
const NO_SCORES: ProcessedScore[] = []

const QUIET_ROW_MODIFIERS = [foregroundStyle(c.secondaryLabel)]

type ScoreListProps = {
	sections: DaySection[]
	onRefresh: () => Promise<unknown>
}

/**
 * Every day's games in one list, a section per day.
 *
 * The list opens at its top, which is Today: the scores feed drops each game
 * at midnight Central, so earlier days appear only under the debug date or the
 * UI-test fixtures. `@expo/ui` has no way to scroll a `List` to a row --
 * `scrollPosition(id:)` needs a `scrollTargetLayout()` stack a `List` does not
 * have -- so opening at Today with earlier days above waits on #8565.
 */
function ScoreList({sections, onRefresh}: ScoreListProps): React.ReactNode {
	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				{sections.map((section) => (
					<Section key={section.key} title={section.title}>
						{section.data.length === 0 ? (
							<Text modifiers={QUIET_ROW_MODIFIERS}>No games today</Text>
						) : (
							section.data.map((score) => <AthleticsRow key={score.id} score={score} />)
						)}
					</Section>
				))}
			</List>
		</Host>
	)
}

function AthleticsView(): React.ReactNode {
	const [debugDate, setDebugDate] = React.useState<Date | null>(null)
	const selectedSports = useFilterStore((s) => s.selectedSports)
	const setSelectedSports = useFilterStore((s) => s.setSelectedSports)
	const toggleSport = useFilterStore((s) => s.toggleSport)
	const setAvailableSports = useFilterStore((s) => s.setAvailableSports)

	const {data = NO_SCORES, error, refetch, isLoading, isError} = useQuery(athleticsOptions)

	// The day the list is laid out around. Held steady between renders so the
	// grouping below doesn't re-run against a clock that has moved on.
	// `now()` rather than `new Date()`: under UI testing it answers the frozen
	// date the fixtures are written around, so which games count as today does
	// not depend on the day the suite happens to run.
	const today = React.useMemo(() => debugDate ?? now().toDate(), [debugDate])

	const sports = React.useMemo(() => sportFilterSections(data), [data])

	// Keep availableSports in sync so the filter-hint selector can compare membership
	React.useEffect(() => {
		setAvailableSports(sports.flatMap((section) => section.data))
	}, [sports, setAvailableSports])

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
			<SportsMenu
				onReset={() => setSelectedSports([])}
				onToggleSport={toggleSport}
				sections={sports}
				selectedSports={selectedSports}
			/>
			{filtered.length === 0 ? (
				<EmptyListNotice />
			) : (
				// Keyed on the day so a new debug date lays the list out afresh,
				// opened at its top.
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
