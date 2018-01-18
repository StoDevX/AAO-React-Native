// @flow

import * as React from 'react'
import {StyleSheet, View, Text, Platform, RefreshControl} from 'react-native'
import {SearchableAlphabetListView} from '../components/searchable-alphabet-listview'
import type {TopLevelViewPropsType} from '../types'
import LoadingView from '../components/loading'
import delay from 'delay'
import {NoticeView} from '../components/notice'
import {Row, Column} from '../components/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
} from '../components/list'
import {tracker} from '../../analytics'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import filter from 'lodash/filter'
import startCase from 'lodash/startCase'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'

const orgsUrl =
	'https://www.stolaf.edu/orgs/list/index.cfm?fuseaction=getall&nostructure=1'
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
	results: {[key: string]: StudentOrgType[]},
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
		results: {},
		refreshing: false,
		loading: true,
		error: false,
	}

	componentWillMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async () => {
		const responseData: StudentOrgType[] = await fetchJson(orgsUrl).catch(
			err => {
				reportNetworkProblem(err)
				this.setState(() => ({error: true}))
				return []
			},
		)

		const sortableRegex = /^(St\.? Olaf(?: College)?|The) +/i
		const withSortableNames = responseData.map(item => {
			const sortableName = item.name.replace(sortableRegex, '')

			return {
				...item,
				$sortableName: sortableName,
				$groupableName: startCase(sortableName)[0],
			}
		})

		const sorted = sortBy(withSortableNames, '$sortableName')
		const grouped = groupBy(sorted, '$groupableName')
		this.setState(() => ({orgs: sorted, results: grouped}))
	}

	refresh = async () => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
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
		tracker.trackEvent('student-org', data.name)
		this.props.navigation.navigate('StudentOrgsDetailView', {org: data})
	}

	performSearch = (text: ?string) => {
		if (!text) {
			this.setState(state => ({
				results: groupBy(state.orgs, '$groupableName'),
			}))
			return
		}

		const query = text.toLowerCase()
		this.setState(state => {
			const filteredResults = filter(state.orgs, org =>
				orgToArray(org).some(word => word.startsWith(query)),
			)
			return {results: groupBy(filteredResults, '$groupableName')}
		})
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		if (!size(this.state.orgs)) {
			return <NoticeView text="No organizations found." />
		}

		const refreshControl = (
			<RefreshControl
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
			/>
		)

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={
					ROW_HEIGHT +
					(Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
				}
				data={this.state.results}
				onSearch={this.performSearch}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
				style={styles.wrapper}
			/>
		)
	}
}
