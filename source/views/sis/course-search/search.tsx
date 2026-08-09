import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {SearchButton} from '@frogpond/navigation-buttons'
import {useNavigation, useRouter} from 'expo-router'
import {debounce} from 'lodash'
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

let _debounce = debounce((query: string, callback: () => void) => {
	if (query.length >= 2) {
		callback()
	}
}, 1500)

export const NavigationOptions = {
	title: 'Course Catalog',
}

const RightButton: React.FC<{onPress: () => void}> = ({onPress}) => (
	<SearchButton onPress={onPress} title="Browse" />
)

export const CourseSearchView = (): React.ReactNode => {
	let navigation = useNavigation()
	let router = useRouter()

	let {isLoading, error, refetch} = useFilters()

	let recentFilters = useAppSelector(selectRecentFilters)
	let recentSearches = useAppSelector(selectRecentSearches)

	let [typedQuery, setTypedQuery] = React.useState('')

	React.useLayoutEffect(() => {
		const getRightButton = () => (
			<RightButton
				onPress={() =>
					router.push({
						pathname: '/CourseSearchResults',
						params: {initialQuery: ''},
					})
				}
			/>
		)

		navigation.setOptions({
			headerRight: getRightButton,
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) => {
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation, router, typedQuery])

	let showSearchResult = React.useCallback(
		(query: string) => {
			router.push({
				pathname: '/CourseSearchResults',
				params: {initialQuery: query},
			})
		},
		[router],
	)

	React.useEffect(() => {
		_debounce(typedQuery, () => {
			showSearchResult(typedQuery)
		})
	}, [showSearchResult, typedQuery])

	let onRecentFilterPress = React.useCallback(
		(text: string) => {
			router.push({
				pathname: '/CourseSearchResults',
				params: {filterDescription: text},
			})
		},
		[router],
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
