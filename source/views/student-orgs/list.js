// @flow

import * as React from 'react'
import {StyleSheet, View, Text, Platform, RefreshControl} from 'react-native'
import {SearchableAlphabetListView} from '@frogpond/listview'
import type {TopLevelViewPropsType} from '../types'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {Row, Column} from '@frogpond/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
} from '@frogpond/lists'
import {trackOrgOpen} from '@frogpond/analytics'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import startCase from 'lodash/startCase'
import * as c from '@frogpond/colors'
import type {StudentOrgType} from './types'
import {API} from '@frogpond/api'
import {fetchCached, type CacheResult} from '@frogpond/cache'

type StudentOrgCache = CacheResult<?Array<StudentOrgType>>
const fetchOrgs = (forReload?: boolean): StudentOrgCache =>
	fetchCached(API('/orgs'), {forReload})

const leftSideSpacing = 20
const ROW_HEIGHT = Platform.OS === 'ios' ? 58 : 74
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const orgToArray = (term: StudentOrgType) =>
	uniq([
		...splitToArray(term.name),
		...splitToArray(term.category),
		...splitToArray(term.description),
	])

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	row: {
		height: ROW_HEIGHT,
		paddingRight: 2,
	},
	rowSectionHeader: {
		height: SECTION_HEADER_HEIGHT,
	},
	badgeContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
		width: leftSideSpacing,
	},
	badge: {
		fontSize: Platform.OS === 'ios' ? 24 : 28,
		color: c.transparent,
	},
})

type Props = TopLevelViewPropsType

type State = {
	orgs: Array<StudentOrgType>,
	query: string,
	refreshing: boolean,
	error: boolean,
	loading: boolean,
}

export class StudentOrgsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Student Orgs',
		headerBackTitle: 'Orgs',
	}

	searchBar: any

	state = {
		orgs: [],
		query: '',
		refreshing: false,
		loading: true,
		error: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async (refresh?: boolean) => {
		let {value} = await fetchOrgs(refresh)

		value = value || []

		let sortableRegex = /^(St\.? Olaf(?: College)?|The) +/iu
		let withSortableNames = value.map(item => {
			let sortableName = item.name.replace(sortableRegex, '')

			return {
				...item,
				$sortableName: sortableName,
				$groupableName: startCase(sortableName)[0],
			}
		})

		let sorted = sortBy(withSortableNames, '$sortableName')
		this.setState(() => ({orgs: sorted}))
	}

	refresh = async () => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	renderSectionHeader = ({title}: {title: string}) => (
		<ListSectionHeader
			spacing={{left: leftSideSpacing}}
			style={styles.rowSectionHeader}
			title={title}
		/>
	)

	renderRow = ({item}: {item: StudentOrgType}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={[styles.row]}
			fullWidth={true}
			onPress={() => this.onPressRow(item)}
		>
			<Row alignItems="flex-start">
				<View style={styles.badgeContainer}>
					<Text style={styles.badge}>•</Text>
				</View>

				<Column flex={1}>
					<Title lines={1}>{item.name}</Title>
					<Detail lines={1}>{item.category}</Detail>
				</Column>
			</Row>
		</ListRow>
	)

	renderSeparator = (sectionId: string, rowId: string) => (
		<ListSeparator
			key={`${sectionId}-${rowId}`}
			spacing={{left: leftSideSpacing}}
		/>
	)

	onPressRow = (data: StudentOrgType) => {
		trackOrgOpen(data.name)
		this.props.navigation.navigate('StudentOrgsDetailView', {org: data})
	}

	performSearch = (text: string) => {
		this.setState(() => ({query: text}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		if (!this.state.orgs.length) {
			return <NoticeView text="No organizations found." />
		}

		const refreshControl = (
			<RefreshControl
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
			/>
		)

		let results = this.state.orgs
		if (this.state.query) {
			let {query, orgs} = this.state
			query = query.toLowerCase()
			results = orgs.filter(org =>
				orgToArray(org).some(word => word.startsWith(query)),
			)
		}
		let groupedResults = groupBy(results, '$groupableName')

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={
					ROW_HEIGHT +
					(Platform.OS === 'ios' ? (11 / 12) * StyleSheet.hairlineWidth : 0)
				}
				data={groupedResults}
				onSearch={this.performSearch}
				query={this.state.query}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
				style={styles.wrapper}
			/>
		)
	}
}
