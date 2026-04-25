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
import {Constants} from './constants'
import {DateGroupedScores, DateSection, Score} from './types'
import {formatDateString, parseGameDate} from './utils'

type TabSection = DateSection | typeof Constants.FILTER

export function AthleticsListView(): React.ReactNode {
	const [selectedSection, setSelectedSection] = React.useState<TabSection>(Constants.TODAY)
	const {selectedSports, setSelectedSports} = useFilterStore()
	const insets = useSafeAreaInsets()

	const {data = [], error, refetch, isLoading, isError} = useQuery(athleticsOptions)

	// Derive the list of available sports from the data
	const sports = React.useMemo(() => {
		const allSports = data.flatMap((section) => section.data.map((score) => score.sport))
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

	// Apply the sport filter to the fetched data
	const filteredData = React.useMemo<DateGroupedScores[]>(() => {
		return data.map((section) => ({
			...section,
			data: section.data.filter(
				(score) => selectedSports.length === 0 || selectedSports.includes(score.sport),
			),
		}))
	}, [data, selectedSports])

	// Build sections to render depending on the selected tab
	const sections = React.useMemo(() => {
		if (selectedSection === Constants.FILTER) {
			return []
		}

		if (selectedSection === Constants.UPCOMING) {
			// Combine all upcoming entries and sub-group by date
			const upcomingScores = filteredData
				.filter((s) => s.title !== Constants.YESTERDAY && s.title !== Constants.TODAY)
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
			const yesterdaySection = filteredData.find((s) => s.title === Constants.YESTERDAY)
			const finalized = yesterdaySection?.data.filter((score) => score.result !== '') ?? []
			return finalized.length ? [{title: '', data: finalized}] : []
		}

		if (selectedSection === Constants.TODAY) {
			const todaySection = filteredData.find((s) => s.title === Constants.TODAY)
			const scores = todaySection?.data ?? []
			return [
				{title: Constants.ONGOING, data: scores.filter((s) => s.status.indicator === 'O')},
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
			<TabBar selectedSection={selectedSection} onSelectSection={setSelectedSection} />
			{selectedSection === Constants.FILTER ? (
				<AthleticsFilters sports={sports} />
			) : (
				<SectionList
					contentContainerStyle={styles.sectionListContent}
					contentInset={{top: 0, bottom: insets.bottom}}
					keyExtractor={(item) => item.id}
					ListEmptyComponent={
						<NoticeView
							style={styles.emptyNotice}
							text="No games available. Try changing the filters."
						/>
					}
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
	emptyNotice: {
		backgroundColor: c.transparent,
	},
})
