// @flow

import React from 'react'
import {StyleSheet, View, Text, Image, Platform} from 'react-native'
import {SearchableAlphabetListView} from '@frogpond/listview'
import debounce from 'lodash/debounce'
import type {TopLevelViewPropsType} from '../types'
import {Row, Column} from '@frogpond/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
} from '@frogpond/lists'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import filter from 'lodash/filter'
import isString from 'lodash/isString'
import {fetch} from '@frogpond/fetch'
import * as c from '@frogpond/colors'
import startCase from 'lodash/startCase'
import type {DirectoryType} from './types'
import Icon from 'react-native-vector-icons/Ionicons'
import isEmpty from 'lodash/isEmpty'

const url = 'https://www.stolaf.edu/directory/index.cfm'

const leftSideSpacing = 20
const rowHeight = Platform.OS === 'ios' ? 58 : 74
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	row: {
		height: rowHeight,
		marginLeft: 22,
	},
	rowSectionHeader: {
		height: headerHeight,
	},
	image: {
		width: 35,
		marginRight: 10,
	},
	emptySearch: {
		flex: 1,
		top: -150,
		alignItems: 'center',
	},
	emptySearchText: {
		fontSize: 18,
		color: c.black,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
})

export class DirectoryView extends React.Component {
	static navigationOptions = {
		title: 'Directory',
		headerBackTitle: 'Home',
	}

	props: TopLevelViewPropsType

	searchBar: any

	state: {
		results: {[key: string]: Array<DirectoryType>},
		refreshing: boolean,
		error: boolean,
		loaded: boolean,
	} = {
		results: {},
		refreshing: false,
		error: false,
		loaded: false,
	}

	fetchData = async (query: string) => {
		try {
			let responseData: Array<DirectoryType> = await fetch(url, {
				cache: 'no-store',
				searchParams: {
					fuseaction: 'SearchResults',
					format: 'json',
					query: query,
				},
			}).json()

			const results = responseData.results

			const sortableRegex = /^(St\.? Olaf(?: College)?|The) +/iu
			const withSortableNames = results.map(item => {
				const sortableName = item.lastName.replace(sortableRegex, '')

				return {
					...item,
					$sortableName: sortableName,
					$groupableName: head(startCase(sortableName)),
				}
			})

			const sorted = sortBy(withSortableNames, '$sortableName')
			const grouped = groupBy(sorted, '$groupableName')
			this.setState(() => ({
				results: grouped,
			}))
		} catch (err) {
			this.setState(() => ({
				error: true,
			}))
			console.error(err)
		}

		this.setState(() => {
			loaded: true
		})
	}

	renderSectionHeader = ({title}: {title: string}) => {
		return (
			<ListSectionHeader
				spacing={{left: leftSideSpacing}}
				style={styles.rowSectionHeader}
				title={title}
			/>
		)
	}

	renderRow = ({item}: {item: DirectoryType}) => {
		return item.displayName ? (
			<ListRow
				arrowPosition="none"
				contentContainerStyle={[styles.row]}
				fullWidth={true}
				onPress={() => this.onPressRow(item)}
			>
				<Row>
					<Image source={{uri: item.thumbnail}} style={styles.image} />
					<Column flex={1}>
						<Title lines={1}>{item.displayName}</Title>
						<Detail lines={1}>{item.title}</Detail>
					</Column>
				</Row>
			</ListRow>
		) : null
	}

	renderSeparator = (sectionId: string, rowId: string) => {
		return (
			<ListSeparator
				key={`${sectionId}-${rowId}`}
				spacing={{left: leftSideSpacing}}
			/>
		)
	}

	onPressRow = (data: DirectoryType) => {
		this.props.navigation.navigate('DirectoryDetailView', {contact: data})
	}

	// todo: fix str being null causing a promise exception
	// todo: fix the ternary form of this returning [''] causing "unable to find node on an unmounted component"
	splitToArray = (str: string) => {
		return words(deburr(str.toLowerCase()))
	}

	// todo: add splits for props that exist depending on type of contact
	//       e.g. student vs faculty vs staff vs
	directoryToArray = (entry: DirectoryType) => {
		return uniq([
			...this.splitToArray(entry.firstName),
			...this.splitToArray(entry.lastName),
			...this.splitToArray(entry.email),
			...this.splitToArray(entry.title),
			...this.splitToArray(entry.officePhone),
			...this.splitToArray(entry.extension),
		])
	}

	_performSearch = async (text: string) => {
		// android clear button returns an object...
		// ...and we need to check if the query exists
		if (!isString(text) || !text || isEmpty(text)) {
			this.setState(() => ({results: []}))
			return
		}

		const query = text.toLowerCase()
		await this.fetchData(query)

		const filteredResults = filter(this.state.results, entry =>
			this.directoryToArray(entry[0]).some(word => word.startsWith(query)),
		)

		this.setState(() => ({
			results: groupBy(uniq(filteredResults), '$groupableName'),
		}))
	}

	// we need to make the search run slightly behind the UI
	performSearch = debounce(this._performSearch, 1000)

	render() {
		const emptyNotice = !size(this.state.results) ? (
			<View style={styles.emptySearch}>
				<Icon color={c.black} name="ios-search" size={54} />
				<Text style={styles.emptySearchText}>Search the Directory</Text>
			</View>
		) : null

		return (
			<View style={styles.wrapper}>
				<SearchableAlphabetListView
					cell={this.renderRow}
					// just setting cellHeight sends the wrong values on iOS.
					cellHeight={
						rowHeight +
						(Platform.OS === 'ios' ? (11 / 12) * StyleSheet.hairlineWidth : 0)
					}
					data={this.state.results}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					onSearch={this.performSearch}
					renderSeparator={this.renderSeparator}
					sectionHeader={this.renderSectionHeader}
					sectionHeaderHeight={headerHeight}
					showsVerticalScrollIndicator={false}
				/>
				{emptyNotice}
			</View>
		)
	}
}
