import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {Constants} from '../../source/features/athletics/constants'
import {DebugDatePicker} from '../../source/features/athletics/debug-date-picker'
import {EmptyListNotice} from '../../source/features/athletics/empty-notice'
import {AthleticsFilters} from '../../source/features/athletics/filters'
import {athleticsOptions} from '../../source/features/athletics/query'
import {AthleticsRow} from '../../source/features/athletics/row'
import {useFilterStore} from '../../source/features/athletics/store'
import {TabBar} from '../../source/features/athletics/tabbar'
import type {
	DateGroupedScores,
	ProcessedScore,
	TabSection,
} from '../../source/features/athletics/types'
import {
	filterSectionsBySport,
	groupScoresByDate,
	sectionsForTab,
	sportFilterSections,
} from '../../source/features/athletics/utils'

// Stable so a pending query's default `[]` doesn't invalidate the memos and
// effect below on every render.
const NO_SCORES: ProcessedScore[] = []

function AthleticsView(): React.ReactNode {
	const [selectedSection, setSelectedSection] = React.useState<TabSection>(Constants.TODAY)
	const [debugDate, setDebugDate] = React.useState<Date | null>(null)
	const selectedSports = useFilterStore((s) => s.selectedSports)
	const setAvailableSports = useFilterStore((s) => s.setAvailableSports)

	const {data = NO_SCORES, error, refetch, isLoading, isError} = useQuery(athleticsOptions)

	// The day the buckets are measured from. Held steady between renders so the
	// grouping below doesn't re-run against a clock that has moved on.
	const today = React.useMemo(() => debugDate ?? new Date(), [debugDate])

	// Derive the Women's/Men's/Other sport groups for the filter screen.
	const sports = React.useMemo(() => sportFilterSections(data), [data])

	// Keep availableSports in sync so the filter-hint selector can compare membership
	React.useEffect(() => {
		setAvailableSports(sports.flatMap((s) => s.data))
	}, [sports, setAvailableSports])

	// Group scores relative to the debug date (if set) or real current time.
	// Because the query returns all scores, we can shift "today" freely.
	const baseData = React.useMemo<DateGroupedScores[]>(() => {
		return groupScoresByDate(data, today)
	}, [data, today])

	// Apply the sport filter to the fetched data
	const filteredData = React.useMemo<DateGroupedScores[]>(() => {
		return filterSectionsBySport(baseData, selectedSports)
	}, [baseData, selectedSports])

	// Build sections to render depending on the selected tab.
	const sections = React.useMemo(() => {
		if (selectedSection === Constants.FILTER) {
			return []
		}

		return sectionsForTab(selectedSection, filteredData)
	}, [selectedSection, filteredData])

	// The picker is bound to component state, so like Dictionary's search bar it
	// renders here rather than in the page wrapper, and in every branch below.
	const datePicker = <DebugDatePicker onDateChange={setDebugDate} value={today} />

	if (isError) {
		return (
			<>
				{datePicker}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${String(error)}`}
				/>
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
				<NoticeView text="No sports scores found." />
			</>
		)
	}

	return (
		<>
			{datePicker}
			<View style={styles.container}>
				<TabBar onSelectSection={setSelectedSection} selectedSection={selectedSection} />
				{selectedSection === Constants.FILTER ? (
					<AthleticsFilters sports={sports} />
				) : sections.length === 0 ? (
					<EmptyListNotice selectedSection={selectedSection} />
				) : (
					<Host style={styles.host}>
						<List
							modifiers={[
								listStyle('insetGrouped'),
								refreshable(async () => {
									await refetch()
								}),
							]}
						>
							{sections.map((section, index) => (
								<Section key={section.title || `section-${index}`} title={section.title}>
									{section.data.map((score) => (
										<AthleticsRow key={score.id} score={score} />
									))}
								</Section>
							))}
						</List>
					</Host>
				)}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.secondarySystemBackground,
		flex: 1,
	},
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
