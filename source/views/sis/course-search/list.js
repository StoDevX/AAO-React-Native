// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type {CourseType} from '../../../lib/course-search/types'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import * as c from '../../components/colors'
import {CourseRow} from './row'
import memoize from 'mem'
import {parseTerm} from '../../../lib/course-search'
import {NoticeView} from '../../components/notice'
import {FilterToolbar} from '../components/filter-toolbar'
import type {FilterType} from '../../components/filter'
import {applySearch, sortAndGroupResults} from './lib/execute-search'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	message: {
		paddingVertical: 16,
	},
})

type Props = TopLevelViewPropsType & {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	browsing: boolean,
	courses: Array<CourseType>,
	filters: Array<FilterType>,
	openFilterView: () => mixed,
	query: string,
	updateRecentFilters: (filters: FilterType[]) => any,
}

export class CourseResultsList extends React.Component<Props> {
	keyExtractor = (item: CourseType) => item.clbid.toString()

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={parseTerm(title)} />
	)

	renderItem = ({item}: {item: CourseType}) => (
		<CourseRow course={item} onPress={this.onPressRow} />
	)

	onPressRow = (data: CourseType) => {
		this.props.navigation.navigate('CourseDetailView', {course: data})
	}

	doSearch = (args: {
		query: string,
		filters: Array<FilterType>,
		courses: Array<CourseType>,
		applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	}) => {
		let {query, filters, courses, applyFilters} = args
		query = query.toLowerCase()

		let results = courses.filter(course => applyFilters(filters, course))
		if (query) {
			results = results.filter(course => applySearch(query, course))
		}

		return sortAndGroupResults(results)
	}

	memoizedDoSearch = memoize(this.doSearch, {
		maxAge: 1000,
		cacheKey: (...args) => args,
	})

	render() {
		let {filters, browsing, query, courses, applyFilters} = this.props

		let results = memoizedDoSearch({query, filters, courses, applyFilters})

		const header = (
			<FilterToolbar filters={filters} onPress={this.props.openFilterView} />
		)

		const message = browsing
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
				contentContainerStyle={styles.container}
				extraData={this.props}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={(results: any)}
				windowSize={10}
			/>
		)
	}
}
