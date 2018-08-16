// @flow

import * as React from 'react'
import {StyleSheet, SectionList, ActivityIndicator} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type {CourseType} from '../../../lib/course-search/types'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import * as c from '../../components/colors'
import {CourseRow} from './row'
import memoize from 'lodash/memoize'
import {parseTerm} from '../../../lib/course-search'
import {NoticeView} from '../../components/notice'
import {FilterToolbar} from '../../components/filter'
import type {FilterType} from '../../components/filter'
import {applySearch, sortAndGroupResults} from './lib/execute-search'

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

type Props = TopLevelViewPropsType & {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	courses: Array<CourseType>,
	filters: Array<FilterType>,
	onPopoverDismiss: (filter: FilterType) => any,
	onListItemPress?: CourseType => any,
	query: string,
	style?: any,
	contentContainerStyle?: any,
	filtersLoaded: boolean,
}

function doSearch(args: {
	query: string,
	filters: Array<FilterType>,
	courses: Array<CourseType>,
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
}) {
	let {query, filters, courses, applyFilters} = args

	let results = courses.filter(course => applyFilters(filters, course))
	if (query) {
		results = results.filter(course => applySearch(query, course))
	}

	return sortAndGroupResults(results)
}

let memoizedDoSearch = memoize(doSearch)
memoizedDoSearch.cache = new WeakMap()

export class CourseResultsList extends React.PureComponent<Props> {
	keyExtractor = (item: CourseType) => item.clbid.toString()

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={parseTerm(title)} />
	)

	renderItem = ({item}: {item: CourseType}) => (
		<CourseRow course={item} onPress={this.onPressRow} />
	)

	onPressRow = (data: CourseType) => {
		if (this.props.onListItemPress) {
			this.props.onListItemPress(data)
		}
		this.props.navigation.navigate('CourseDetailView', {course: data})
	}

	render() {
		let {
			filters,
			query,
			courses,
			applyFilters,
			onPopoverDismiss,
			contentContainerStyle,
			style,
			filtersLoaded,
		} = this.props

		// be sure to lowercase the query before calling doSearch, so that the memoization
		// doesn't break when nothing's changed except case.
		query = query.toLowerCase()
		let results = memoizedDoSearch({query, filters, courses, applyFilters})

		const header = filtersLoaded ? (
			<FilterToolbar filters={filters} onPopoverDismiss={onPopoverDismiss} />
		) : (
			<ActivityIndicator style={styles.spinner} />
		)

		const hasActiveFilter = filters.some(f => f.enabled)

		const message = hasActiveFilter
			? 'There were no courses that matched your selected filters. Try a different filter combination.'
			: query.length
				? 'There were no courses that matched your query. Please try again.'
				: "You can search by Professor (e.g. 'Jill Dietz'), Course Name (e.g. 'Abstract Algebra'), Department/Number (e.g. MATH 252), or GE (e.g. WRI)"

		const messageView = <NoticeView style={styles.message} text={message} />

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={messageView}
				ListHeaderComponent={header}
				contentContainerStyle={[styles.container, contentContainerStyle]}
				extraData={this.props}
				keyExtractor={this.keyExtractor}
				keyboardDismissMode="interactive"
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={(results: any)}
				style={style}
				windowSize={10}
			/>
		)
	}
}
