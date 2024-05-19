import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {SearchButton} from '@frogpond/navigation-buttons'
import {debounceSearch} from '@frogpond/use-debounce'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {fromPairs} from 'lodash'
import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {ChangeTextEvent} from '../../../navigation/types'
import {useAppSelector} from '../../../redux'
import {
	selectRecentFilters,
	selectRecentSearches,
} from '../../../redux/parts/courses'
import {RecentItemsList} from '../components/recents-list'
import {useFilters} from './lib/build-filters'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Course Catalog',
}

export const CourseSearchView = (): JSX.Element => {
	let navigation = useNavigation()

	let {data: basicFilters = [], isLoading, error} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)
	let recentSearches = useAppSelector(selectRecentSearches)

	let [typedQuery, setTypedQuery] = React.useState('')

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<SearchButton
					onPress={() =>
						navigation.navigate('CourseSearchResults', {initialQuery: ''})
					}
					title="Browse"
				/>
			),
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) => {
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation, typedQuery])

	let showSearchResult = React.useCallback(
		(query: string) => {
			navigation.navigate('CourseSearchResults', {initialQuery: query})
		},
		[navigation],
	)

	React.useEffect(() => {
		debounceSearch(typedQuery, () => {
			showSearchResult(typedQuery)
		})
	}, [showSearchResult, typedQuery])

	let onRecentFilterPress = React.useCallback(
		(text: string) => {
			let selectedFilterCombo = recentFilters.find(
				(f) => f.description === text,
			)

			let selectedFilters = basicFilters
			if (selectedFilterCombo) {
				let filterLookup = fromPairs(
					selectedFilterCombo.filters.map((f) => [f.key, f]),
				)
				selectedFilters = basicFilters.map((f) => filterLookup[f.key] || f)
			}

			navigation.navigate('CourseSearchResults', {
				initialFilters: selectedFilters,
			})
		},
		[basicFilters, navigation, recentFilters],
	)

	if (isLoading) {
		return <LoadingView text="Loading Course Data…" />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				// onPress={refetch}  // TODO: implement refetch here
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	let recentFilterDescriptions = recentFilters.map((f) => f.description)

	return (
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
					onItemPress={onRecentFilterPress}
					title="Browse"
				/>
			</ScrollView>
		</View>
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
