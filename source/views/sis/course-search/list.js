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
	filters: Array<FilterType>,
	onFiltersChange: filters => any,
	searchPerformed: boolean,
	terms: Array<{title: string, data: CourseType[]}>,
}

export class CourseSearchResultsList extends React.PureComponent<Props> {
	onPressRow = (data: CourseType) => {
		this.props.navigation.navigate('CourseDetailView', {course: data})
	}

	keyExtractor = (item: CourseType) => item.clbid.toString()

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={parseTerm(title)} />
	)

	renderItem = ({item}: {item: CourseType}) => (
		<CourseRow course={item} onPress={this.onPressRow} />
	)

	componentWillMount() {
		this.updateFilters(this.props)
	}

	componentWillReceiveProps(nextProps: Props) {
		this.updateFilters(nextProps)
	}

	updateFilters = (props: Props) => {
		const {filters} = props

		// prevent ourselves from overwriting the filters from redux on mount
		if (filters.length) {
			return
		}

		const newFilters = buildFilters()
		props.onFiltersChange(newFilters)
	}

	onPressToolbar = () => {
		this.props.navigation.navigate('FilterView', {
			title: 'Add Filters',
			pathToFilters: ['courseSearch', 'filters'],
			onChange: filters => this.props.onFiltersChange(filters),
		})
	}

	render() {
		const {filters} = this.props

		const header = (
			<FilterToolbar
				filters={filters}
				onPress={this.onPressToolbar}
			/>
		)

		const message = this.props.searchPerformed
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
				sections={(this.props.terms: any)}
			/>
		)
	}
}
