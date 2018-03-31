// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type {CourseType} from '../../../lib/course-search/types'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import * as c from '../../components/colors'
import {CourseRow} from './row'
import {parseTerm} from '../../../lib/course-search'
import {NoticeView} from '../../components/notice'
import {FilterToolbar} from '../components/filter-toolbar'
import {buildFilters} from './lib/build-filters'
import type {FilterType} from '../../components/filter'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	message: {
		paddingVertical: 16,
	},
})

type Props = TopLevelViewPropsType & {
	browsing: boolean,
	filters: Array<FilterType>,
	onFiltersChange: (Array<FilterType>) => any,
	searchPerformed: boolean,
	terms: Array<{title: string, data: CourseType[]}>,
	updateRecentFilters: (filters: FilterType[]) => any,
}

export class CourseSearchResultsList extends React.PureComponent<Props> {
	componentDidUpdate() {
		// prevent ourselves from overwriting the filters from redux on mount
		if (this.props.filters.length) {
			return null
		}

		buildFilters().then(this.props.onFiltersChange)
	}

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

	onPressToolbar = () => {
		this.props.navigation.navigate('FilterView', {
			title: 'Add Filters',
			pathToFilters: ['courses', 'filters'],
			onChange: filters => this.props.onFiltersChange(filters),
			onLeave: filters => this.props.updateRecentFilters(filters),
		})
	}

	render() {
		const {filters, browsing} = this.props

		const header = (
			<FilterToolbar filters={filters} onPress={this.onPressToolbar} />
		)

		let message = this.props.searchPerformed
			? 'There were no courses that matched your query. Please try again.'
			: "You can search by Professor (e.g. 'Jill Dietz'), Course Name (e.g. 'Abstract Algebra'), Department/Number (e.g. MATH 252), or GE (e.g. WRI)"
		message = browsing
			? 'There were no courses that matched your selected filters. Try a different filter combination.'
			: message
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
				sections={(this.props.terms: any)}
			/>
		)
	}
}
