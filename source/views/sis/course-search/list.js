// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import type {TopLevelViewPropsType} from '../../types'
import type {CourseType} from '../../../lib/course-search/types'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import * as c from '../../components/colors'
import {CourseRow} from './row'
import {parseTerm} from '../../../lib/course-search'
import type {FilterType} from './filters/types'
import {FilterToolbar} from '../components/filter-toolbar'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType & {
	filters: Array<FilterType>,
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

	onPressToolbar = () => {
		this.props.navigation.navigate('CourseSearchFiltersView')
	}

	render() {
		const {filters} = this.props

		const header = (
			<FilterToolbar
				filters={filters}
				onPress={this.onPressToolbar}
			/>
		)
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
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
