import * as React from 'react'
import {
	StyleSheet,
	SectionList,
	ActivityIndicator,
	StyleProp,
	ViewStyle,
} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {sto} from '../../../lib/colors'
import {CourseRow} from './row'
import memoize from 'lodash/memoize'
import {parseTerm} from '../../../lib/course-search'
import {NoticeView} from '@frogpond/notice'
import {FilterToolbar} from '@frogpond/filter'
import {FilterType} from '@frogpond/filter'
import {applySearch, sortAndGroupResults} from './lib/execute-search'
import {useNavigation} from '@react-navigation/native'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	message: {
		paddingVertical: 16,
	},
	spinner: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 8,
	},
})

type Props = {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean
	courses: Array<CourseType>
	filters: Array<FilterType>
	onPopoverDismiss: (filter: FilterType) => void
	onListItemPress?: (course: CourseType) => void
	query: string
	style?: ViewStyle
	contentContainerStyle?: StyleProp<ViewStyle>
	filtersLoaded: boolean
}

function doSearch(args: {
	query: string
	filters: Array<FilterType>
	courses: Array<CourseType>
	applyFilters: (filters: FilterType[], item: CourseType) => boolean
}) {
	let {query, filters, courses, applyFilters} = args

	let results = courses.filter((course) => applyFilters(filters, course))
	if (query) {
		results = results.filter((course) => applySearch(query, course))
	}

	return sortAndGroupResults(results)
}

let memoizedDoSearch = memoize(doSearch)

// lodash supports this; the types do not.
memoizedDoSearch.cache = new WeakMap()

export const CourseResultsList = (props: Props): JSX.Element => {
	let navigation = useNavigation()

	let {
		filters,
		query,
		courses,
		applyFilters,
		onPopoverDismiss,
		contentContainerStyle,
		style,
		filtersLoaded,
	} = props

	// be sure to lowercase the query before calling doSearch, so that the memoization
	// doesn't break when nothing's changed except case.
	query = query?.toLowerCase()
	let results = memoizedDoSearch({query, filters, courses, applyFilters})

	let header = filtersLoaded ? (
		<FilterToolbar filters={filters} onPopoverDismiss={onPopoverDismiss} />
	) : (
		<ActivityIndicator style={styles.spinner} />
	)

	let hasActiveFilter = filters.some((f) => f.enabled)

	let message = hasActiveFilter
		? 'There were no courses that matched your selected filters. Try a different filter combination.'
		: query?.length
		? 'There were no courses that matched your query. Please try again.'
		: "You can search by Professor (e.g. 'Jill Dietz'), Course Name (e.g. 'Abstract Algebra'), Department/Number (e.g. MATH 252), or GE (e.g. WRI)"

	let messageView = (
		<NoticeView
			icon="leaf-outline"
			iconColor={sto.lime}
			style={styles.message}
			text={message}
		/>
	)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={messageView}
			ListHeaderComponent={header}
			contentContainerStyle={[styles.container, contentContainerStyle]}
			contentInsetAdjustmentBehavior="automatic"
			extraData={props}
			keyExtractor={(item: CourseType) => item.clbid.toString()}
			keyboardDismissMode="interactive"
			renderItem={({item}: {item: CourseType}) => (
				<CourseRow
					course={item}
					onPress={(data: CourseType) => {
						if (props.onListItemPress) {
							props.onListItemPress(data)
						}
						navigation.navigate('CourseDetail', {course: data})
					}}
				/>
			)}
			renderSectionHeader={({section: {title}}: any) => (
				<ListSectionHeader title={parseTerm(title)} />
			)}
			sections={results}
			style={style}
			windowSize={10}
		/>
	)
}
