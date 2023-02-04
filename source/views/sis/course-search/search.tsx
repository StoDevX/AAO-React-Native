import React, {useState, useCallback, useEffect, useLayoutEffect} from 'react'

import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {debounce} from 'lodash'
import {ScrollView, StyleSheet, View} from 'react-native'
import {ChangeTextEvent} from '../../../navigation/types'
import {useAppSelector} from '../../../redux'
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

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Course Catalog',
}

export const CourseSearchView = (): JSX.Element => {
	let navigation = useNavigation()

	let {data: basicFilters = [], isLoading, error} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)
	let recentSearches = useAppSelector(selectRecentSearches)

	let [typedQuery, setTypedQuery] = useState('')

	useLayoutEffect(() => {
		// TODO: refactor the SIS tabview to not be tabview in order to support search.
		// search will not be injected properly embedded inside of a tab navigator and
		// calling navigation.getParent() is not a solution because the parent is a tab
		// navigator so all top-level tabs here would receive a searchbar. For now we
		// can at least rely on the "browse all" button to let us view search.
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) => {
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation, typedQuery])

	let showSearchResult = useCallback(
		(query: string) => {
			navigation.navigate('CourseSearchResults', {initialQuery: query})
		},
		[navigation],
	)

	useEffect(() => {
		_debounce(typedQuery, () => {
			showSearchResult(typedQuery)
		})
	}, [showSearchResult, typedQuery])

	let browseAll = () => {
		navigation.navigate('CourseSearchResults', {initialQuery: ''})
	}

	let onRecentFilterPress = useCallback(
		(text: string) => {
			let selectedFilterCombo = recentFilters.find(
				(f) => f.description === text,
			)

			let selectedFilters = selectedFilterCombo?.filters ?? basicFilters

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
					actionLabel="Browse All"
					emptyHeader="No recent filter combinations"
					emptyText="Your recent filter combinations will appear here."
					items={recentFilterDescriptions}
					onAction={browseAll}
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
