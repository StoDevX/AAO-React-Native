import * as React from 'react'
import {SectionList, StyleSheet, Text, View} from 'react-native'
import {Stack} from 'expo-router'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
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
import type {DateGroupedScores, DateSection} from '../../source/features/athletics/types'
import {groupScoresByDate} from '../../source/features/athletics/utils'

type TabSection = DateSection | typeof Constants.FILTER

function AthleticsView(): React.ReactNode {
	const [selectedSection, setSelectedSection] = React.useState<TabSection>(Constants.TODAY)
	const [debugDate, setDebugDate] = React.useState<Date | null>(null)
	const {selectedSports, setAvailableSports} = useFilterStore()
	const insets = useSafeAreaInsets()

	const {data = [], error, refetch, isLoading, isError} = useQuery(athleticsOptions)

	// The day the buckets are measured from. Held steady between renders so the
	// grouping below doesn't re-run against a clock that has moved on.
	const today = React.useMemo(() => debugDate ?? new Date(), [debugDate])

	// Derive the list of available sports from the data
	const sports = React.useMemo(() => {
		const uniqueSports = [...new Set(data.map((s) => s.sport))].sort()
		const womenSports = uniqueSports.filter((s) => s.includes("Women's"))
		const menSports = uniqueSports.filter((s) => s.includes("Men's"))
		return [
			{title: "Women's Sports", data: womenSports},
			{title: "Men's Sports", data: menSports},
		]
	}, [data])

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
		return baseData.map((section) => ({
			...section,
			data: section.data.filter(
				(score) => selectedSports.length === 0 || selectedSports.includes(score.sport),
			),
		}))
	}, [baseData, selectedSports])

	// Build sections to render depending on the selected tab
	const sections = React.useMemo(() => {
		if (selectedSection === Constants.FILTER) {
			return []
		}

		if (selectedSection === Constants.UPCOMING) {
			// groupScoresByDate already emits one sorted section per upcoming day;
			// just strip the Yesterday/Today fixed buckets.
			return filteredData
				.filter((s) => s.title !== Constants.YESTERDAY && s.title !== Constants.TODAY)
				.filter((s) => s.data.length > 0)
		}

		if (selectedSection === Constants.YESTERDAY) {
			const yesterdaySection = filteredData.find((s) => s.title === Constants.YESTERDAY)
			const finalized = yesterdaySection?.data.filter((score) => score.result !== '') ?? []
			return finalized.length ? [{title: '', data: finalized}] : []
		}

		if (selectedSection === Constants.TODAY) {
			const todaySection = filteredData.find((s) => s.title === Constants.TODAY)
			const scores = todaySection?.data ?? []
			return [
				{
					title: Constants.ONGOING,
					data: scores.filter((s) => s.status.indicator === 'O'),
				},
				{
					title: Constants.FINALIZED,
					data: scores.filter((s) => s.status.indicator !== 'O' && s.result !== ''),
				},
				{
					title: Constants.UPCOMING,
					data: scores.filter((s) => s.status.indicator !== 'O' && s.result === ''),
				},
			].filter((s) => s.data.length > 0)
		}

		return []
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
		return <LoadingView />
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
				) : (
					<SectionList
						ListEmptyComponent={
							<EmptyListNotice selectedSection={selectedSection as DateSection} />
						}
						contentContainerStyle={styles.sectionListContent}
						contentInset={{top: 0, bottom: insets.bottom}}
						keyExtractor={(item) => item.id}
						renderItem={({item}) => <AthleticsRow score={item} />}
						renderSectionHeader={({section: {title}}) =>
							title ? <Text style={styles.sectionHeader}>{title}</Text> : null
						}
						sections={sections}
					/>
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
	sectionListContent: {
		flexGrow: 1,
		padding: 10,
	},
	sectionHeader: {
		backgroundColor: c.secondarySystemBackground,
		color: c.label,
		padding: 5,
		paddingHorizontal: 10,
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
