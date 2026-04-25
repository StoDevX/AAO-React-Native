import * as React from 'react'
import {SectionList, StyleSheet, Text, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useQuery} from '@tanstack/react-query'
import {NoticeView, LoadingView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {athleticsOptions} from './query'
import {AthleticsRow} from './row'
import {TabBar} from './tabbar'
import {AthleticsFilters} from './filters'
import {useFilterStore} from './store'
import {EmptyListNotice} from './empty-notice'
import {DebugDatePicker} from './debug-date-picker'
import {Constants} from './constants'
import {DateGroupedScores, DateSection, Score} from './types'
import {formatDateString, groupScoresByDate, parseGameDate} from './utils'

type TabSection = DateSection | typeof Constants.FILTER

export function AthleticsListView(): React.ReactNode {
	const [selectedSection, setSelectedSection] = React.useState<TabSection>(
		Constants.TODAY,
	)
	const [debugOffset, setDebugOffset] = React.useState(0)
	const {selectedSports, setSelectedSports, setTotalSports} = useFilterStore()
	const insets = useSafeAreaInsets()

	const {
		data = [],
		error,
		refetch,
		isLoading,
		isError,
	} = useQuery(athleticsOptions)

	// Derive the list of available sports from the data
	const sports = React.useMemo(() => {
		const allSports = data.flatMap((section) =>
			section.data.map((score) => score.sport),
		)
		const uniqueSports = [...new Set(allSports)].sort()
		const womenSports = uniqueSports.filter((s) => s.includes("Women's"))
		const menSports = uniqueSports.filter((s) => s.includes("Men's"))
		return [
			{title: "Women's Sports", data: womenSports},
			{title: "Men's Sports", data: menSports},
		]
	}, [data])

	// Seed the filter store with all sports on first load
	React.useEffect(() => {
		if (selectedSports.length === 0 && sports.some((s) => s.data.length > 0)) {
			setSelectedSports(sports.flatMap((s) => s.data))
		}
	}, [sports, selectedSports, setSelectedSports])

	// Keep totalSports in sync so EmptyListNotice can detect filtered-out state
	const uniqueSportCount = React.useMemo(
		() =>
			new Set(
				data.flatMap((section) => section.data.map((score) => score.sport)),
			).size,
		[data],
	)
	React.useEffect(() => {
		setTotalSports(uniqueSportCount)
	}, [uniqueSportCount, setTotalSports])

	// When a debug offset is active, re-group all fetched scores relative to the
	// shifted "today". Scores older than true-yesterday are already dropped by the
	// query so the debug window is roughly ±N days from actual today.
	const debugNow = React.useMemo(() => {
		if (debugOffset === 0) return null
		const d = new Date()
		d.setDate(d.getDate() + debugOffset)
		return d
	}, [debugOffset])

	const baseData = React.useMemo<DateGroupedScores[]>(() => {
		if (!debugNow) return data
		const allScores = data.flatMap((s) => s.data)
		return groupScoresByDate(allScores, debugNow)
	}, [data, debugNow])

	// Apply the sport filter to the fetched data
	const filteredData = React.useMemo<DateGroupedScores[]>(() => {
		return baseData.map((section) => ({
			...section,
			data: section.data.filter(
				(score) =>
					selectedSports.length === 0 || selectedSports.includes(score.sport),
			),
		}))
	}, [baseData, selectedSports])

	// Build sections to render depending on the selected tab
	const sections = React.useMemo(() => {
		if (selectedSection === Constants.FILTER) {
			return []
		}

		if (selectedSection === Constants.UPCOMING) {
			// Combine all upcoming entries and sub-group by date
			const upcomingScores = filteredData
				.filter(
					(s) => s.title !== Constants.YESTERDAY && s.title !== Constants.TODAY,
				)
				.flatMap((s) => s.data)
			const byDate: Record<string, Score[]> = {}
			for (const score of upcomingScores) {
				const date = parseGameDate(score.date_utc)
				const key = formatDateString(date)
				if (!byDate[key]) {
					byDate[key] = []
				}
				byDate[key].push(score)
			}
			return Object.keys(byDate)
				.map((title) => ({title, data: byDate[title]}))
				.filter((s) => s.data.length > 0)
		}

		if (selectedSection === Constants.YESTERDAY) {
			const yesterdaySection = filteredData.find(
				(s) => s.title === Constants.YESTERDAY,
			)
			const finalized =
				yesterdaySection?.data.filter((score) => score.result !== '') ?? []
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
					data: scores.filter(
						(s) => s.status.indicator !== 'O' && s.result !== '',
					),
				},
				{
					title: Constants.UPCOMING,
					data: scores.filter(
						(s) => s.status.indicator !== 'O' && s.result === '',
					),
				},
			].filter((s) => s.data.length > 0)
		}

		return []
	}, [selectedSection, filteredData])

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${String(error)}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	if (data.length === 0) {
		return <NoticeView text="No sports scores found." />
	}

	return (
		<View style={styles.container}>
			<TabBar
				onSelectSection={setSelectedSection}
				selectedSection={selectedSection}
			/>
			{__DEV__ && (
				<DebugDatePicker
					offset={debugOffset}
					onOffsetChange={setDebugOffset}
					referenceDate={debugNow ?? new Date()}
				/>
			)}
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
					renderItem={({item}) => (
						<AthleticsRow
							data={[item]}
							includePrefix={selectedSection === Constants.UPCOMING}
						/>
					)}
					renderSectionHeader={({section: {title}}) =>
						title ? <Text style={styles.sectionHeader}>{title}</Text> : null
					}
					sections={sections}
				/>
			)}
		</View>
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
