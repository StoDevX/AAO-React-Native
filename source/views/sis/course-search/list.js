// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {tracker} from '../../analytics'

import type {TopLevelViewPropsType} from '../types'

import * as c from '../components/colors'
import {ListSeparator, ListSectionHeader} from '../components/list'
import type {CourseType} from '../types'

const ROW_HEIGHT = Platform.OS === 'ios' ? 76 : 89
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const courseToArray = (course: CourseType) =>
	uniq([...splitToArray(course.name), ...splitToArray(course.description)])


const styles = StyleSheet.create({
	row: {
		height: ROW_HEIGHT,
	},
	rowSectionHeader: {
		height: SECTION_HEADER_HEIGHT,
	},
	rowDetailText: {
		fontSize: 14,
	},
})

type Props = TopLevelViewPropsType

type State = {
	results: Array<CourseType>,
  allCourses: Array<CourseType>,
}

export class DictionaryView extends React.PureComponent<Props, State> {

	state = {
		results: [],
    allCourses: [],
	}

	componentWillMount() {
		this.fetchData()
	}

	// refresh = async () => {
	// 	const start = Date.now()
	// 	this.setState(() => ({refreshing: true}))
  //
	// 	await this.fetchData()
  //
	// 	// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
	// 	const elapsed = Date.now() - start
	// 	if (elapsed < 500) {
	// 		await delay(500 - elapsed)
	// 	}
  //
	// 	this.setState(() => ({refreshing: false}))
	// }

	// fetchData = async () => {
	// 	let {data: allTerms} = await fetchJson(dictionaryUrl).catch(err => {
	// 		reportNetworkProblem(err)
	// 		return defaultData
	// 	})
  //
	// 	if (process.env.NODE_ENV === 'development') {
	// 		allTerms = defaultData.data
	// 	}
  //
	// 	this.setState(() => ({allTerms}))
	// }

	onPressRow = (data: CourseType) => {
		// tracker.trackEvent('dictionary', data.word)
		// this.props.navigation.navigate('DictionaryDetailView', {item: data})
    console.log(data)
	}

	renderRow = ({item}: {item: CourseType}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={styles.row}
			onPress={() => this.onPressRow(item)}
		>
			<Column>
				<Title lines={1}>{item.name}</Title>
				<Detail lines={2} style={styles.rowDetailText}>
					{item.description}
				</Detail>
			</Column>
		</ListRow>
	)

	renderSectionHeader = ({title}: {title: string}) => (
		<ListSectionHeader style={styles.rowSectionHeader} title={title} />
	)

	renderSeparator = (sectionId: string, rowId: string) => (
		<ListSeparator key={`${sectionId}-${rowId}`} />
	)

	performSearch = (text: ?string) => {
		if (!text) {
			this.setState(state => ({results: []}))
			return
		}

		const query = text.toLowerCase()
		this.setState(state => ({
			results: state.allCourses.filter(course =>
				courseToArray(course).some(course => course.startsWith(query)),
			),
		}))
	}

	render() {

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={
					ROW_HEIGHT +
					(Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
				}
				data={groupBy(this.state.results, item => item.word[0])}
				onSearch={this.performSearch}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
			/>
      <SectionList
				ItemSeparatorComponent={ListSeparator}
				contentContainerStyle={styles.container}
				extraData={this.props}
				keyExtractor={this.keyExtractor}
				onRefresh={this.props.onRefresh}
				refreshing={this.props.loading}
				renderItem={this.renderRow}
				renderSectionHeader={this.renderSectionHeader}
				sections={(this.props.buildings: any)}
			/>
		)
	}
}
