import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import * as React from 'react'
import {useEffect, useMemo} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {useAppSelector} from '../../source/redux/hooks'
import {selectRecentFilters, selectRecentSearches} from '../../source/redux/parts/courses'
import {RecentItemsList} from '../../source/features/sis/components/recents-list'
import {useFilters} from '../../source/features/sis/course-search/lib/build-filters'
import {SearchBar} from '../../source/components/search-bar'

const SEARCH_DEBOUNCE_MS = 1500
const MIN_QUERY_LENGTH = 2

function CourseSearchView(): React.ReactNode {
	let router = useRouter()

	let {isLoading, error, refetch} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)
	let recentSearches = useAppSelector(selectRecentSearches)

	let [typedQuery, setTypedQuery] = React.useState('')

	let showSearchResult = React.useCallback(
		(query: string) => {
			router.push({
				pathname: '/CourseSearchResults',
				params: {initialQuery: query},
			})
		},
		[router],
	)

	// Re-running on every keystroke clears the previous timer, which is the
	// debounce; the cleanup also cancels a pending search on unmount, so
	// navigating away mid-type cannot push a results screen afterwards.
	useEffect(() => {
		if (typedQuery.length < MIN_QUERY_LENGTH) {
			return
		}

		let timer = setTimeout(() => showSearchResult(typedQuery), SEARCH_DEBOUNCE_MS)

		return () => clearTimeout(timer)
	}, [showSearchResult, typedQuery])

	let recentFilterDescriptions = useMemo(
		() => recentFilters.map((f) => f.description),
		[recentFilters],
	)

	if (isLoading) {
		return <LoadingView text="Loading Course Data…" />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${error}`}
			/>
		)
	}

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setTypedQuery} value={typedQuery} />

			<View style={[styles.container, styles.common]}>
				<ScrollView
					// needed for handling native searchbar alignment
					contentInsetAdjustmentBehavior="automatic"
					keyboardDismissMode="interactive"
					style={[styles.common, styles.bottomContainer]}
				>
					<RecentItemsList
						emptyHeader="No recent searches"
						emptyText="Your recent searches will appear here."
						items={recentSearches}
						onItemPress={showSearchResult}
						title="Recent"
					/>
					<RecentItemsList
						emptyHeader="No recent filter combinations"
						emptyText="Your recent filter combinations will appear here."
						items={recentFilterDescriptions}
						onItemPress={(text) => {
							router.push({
								pathname: '/CourseSearchResults',
								params: {filterDescription: text},
							})
						}}
						title="Browse"
					/>
				</ScrollView>
			</View>
		</>
	)
}

let styles = StyleSheet.create({
	bottomContainer: {
		paddingTop: 12,
	},
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.systemBackground,
	},
})

export default function CourseSearchPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Course Catalog</Stack.Title>
			<CourseSearchView />
		</>
	)
}
