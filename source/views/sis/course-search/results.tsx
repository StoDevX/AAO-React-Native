import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	updateRecentSearches,
	updateRecentFilters,
} from '../../../redux/parts/courses'
import {LoadingView} from '@frogpond/notice'
import type {CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../redux'
import {useSelector, useDispatch} from 'react-redux'
import {CourseResultsList} from './list'
import {applyFiltersToItem} from '@frogpond/filter'
import {FilterType} from '@frogpond/filter'
import {buildFilters} from './lib/build-filters'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {ChangeTextEvent, RootStackParamList} from '../../../navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {white} from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'

type ReduxStateProps = {
	allCourses: Array<CourseType>
	courseDataState: string
}

type ReduxDispatchProps = {
	updateRecentFilters: (filters: FilterType[]) => any
	updateRecentSearches: (query: string) => any
}

// type DefaultProps = {
// 	applyFilters: (filters: FilterType[], item: CourseType) => boolean
// }

type Props = ReduxStateProps & ReduxDispatchProps //& DefaultProps

const CourseSearchResultsView = (props: Props) => {
	let route = useRoute<RouteProp<RootStackParamList, 'CourseSearchResults'>>()
	let {initialFilters, initialQuery} = route.params

	let [searchbarActive, setSearchbarActive] = React.useState(false)
	let [filters, setFilters] = React.useState<FilterType[]>(initialFilters ?? [])
	let [filtersLoaded, setFiltersLoaded] = React.useState(
		initialFilters ?? false,
	)

	let [searchQuery, setSearchQuery] = React.useState(initialQuery ?? '')
	let delayedQuery = useDebounce(searchQuery, 500)

	let navigation = useNavigation()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: white,
				onBlur: () => setSearchbarActive(false),
				onChangeText: (event: ChangeTextEvent) =>
					setSearchQuery(event.nativeEvent.text),
			},
		})
	}, [initialQuery, navigation, searchQuery])

	React.useEffect(() => {
		if (!filters.length) {
			resetFilters()
		}
	}, [filters.length])

	let handleListItemPress = () => {
		if (delayedQuery?.length) {
			// if there is text in the search bar, add the text to the Recent Searches list
			props.updateRecentSearches(delayedQuery)
		} else if (filters.some((f) => f.enabled)) {
			// if there is at least one active filter, add the filter set to the Recent Filters list
			props.updateRecentFilters(filters)
		}
	}

	let updateFilter = (filter: FilterType) => {
		let edited = filters.map((f) => (f.key !== filter.key ? f : filter))
		setFilters(edited)
	}

	let resetFilters = async () => {
		let newFilters = await buildFilters()
		setFilters(newFilters)
		setFiltersLoaded(true)
	}

	if (props.courseDataState !== 'ready') {
		return <LoadingView text="Loading Course Data…" />
	}

	return (
		<CourseResultsList
			key={delayedQuery?.toLowerCase()}
			// applyFilters={props.applyFilters}
			applyFilters={applyFiltersToItem}
			contentContainerStyle={styles.contentContainer}
			courses={props.allCourses}
			filters={filters}
			filtersLoaded={filtersLoaded}
			onListItemPress={handleListItemPress}
			onPopoverDismiss={updateFilter}
			query={delayedQuery}
			style={searchbarActive ? styles.darken : {}}
		/>
	)
}

export function ConnectedCourseSearchResultsView(): JSX.Element {
	let dispatch = useDispatch()

	let allCourses = useSelector(
		(state: ReduxState) => state.courses?.allCourses || [],
	)
	let courseDataState = useSelector(
		(state: ReduxState) => state.courses?.readyState || '',
	)

	let updateSearches = React.useCallback(
		(query: string) => dispatch(updateRecentSearches(query)),
		[dispatch],
	)
	let updateFilters = React.useCallback(
		(filters: FilterType[]) => dispatch(updateRecentFilters(filters)),
		[dispatch],
	)

	return (
		<CourseSearchResultsView
			allCourses={allCourses}
			courseDataState={courseDataState}
			updateRecentFilters={updateFilters}
			updateRecentSearches={updateSearches}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Course Search',
}

let styles = StyleSheet.create({
	contentContainer: {
		flexGrow: 1,
	},
	darken: {},
})
