import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import {debounce} from 'lodash'
import React, {useEffect} from 'react'
import {useMemo} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {useAppSelector} from '../../../redux/hooks'
import {
	selectRecentFilters,
	selectRecentSearches,
} from '../../../redux/parts/courses'
import {RecentItemsList} from '../components/recents-list'
import {useFilters} from './lib/build-filters'

let _debounce = debounce((query: string, callback: () => void) => {
	if (query.length >= 2) {
		callback()
	}
}, 1500)

export const NavigationOptions = {
	title: 'Course Catalog',
}

export const CourseSearchView = (): React.ReactNode => {
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

	useEffect(() => {
		_debounce(typedQuery, () => showSearchResult(typedQuery))
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

			<Stack.SearchBar
				onChangeText={(event) => {
					setTypedQuery(event.nativeEvent.text)
				}}
			/>

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
