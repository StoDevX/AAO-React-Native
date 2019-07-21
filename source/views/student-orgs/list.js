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
import groupBy from 'lodash/groupBy'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import * as c from '@frogpond/colors'
import type {StudentOrgType} from './types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {useAsync, type AsyncState} from 'react-async'
import {useDebounce} from '@frogpond/use-debounce'

const fetchOrgs = (args: {
	signal: window.AbortController,
}): Promise<Array<StudentOrgType>> => {
	return fetch(API('/orgs'), {signal: args.signal}).json()
}

const leftSideSpacing = 20
const ROW_HEIGHT = Platform.OS === 'ios' ? 58 : 74
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41
const CELL_HEIGHT =
	ROW_HEIGHT +
	(Platform.OS === 'ios' ? (11 / 12) * StyleSheet.hairlineWidth : 0)

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function orgToArray(term: StudentOrgType) {
	return Array.from(
		new Set([
			...splitToArray(term.name),
			...splitToArray(term.category),
			...splitToArray(term.description),
		]),
	)
}

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

export function StudentOrgsView(props: Props) {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)
	let [isInitialFetch, setIsInitial] = React.useState(true)

	let {
		data,
		error,
		reload,
		isPending,
	}: AsyncState<?Array<StudentOrgType>> = useAsync(fetchOrgs, {
		onResolve: () => setIsInitial(false),
	})

	let results = React.useMemo(() => {
		let dataArr = data || []

		if (!searchQuery) {
			return dataArr
		}

		return dataArr.filter(org =>
			orgToArray(org).some(word => word.startsWith(searchQuery)),
		)
	}, [data, searchQuery])

	let grouped = React.useMemo(() => {
		return groupBy(results, '$groupableName')
	}, [results])

	// conditionals must come after all hooks
	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the definitions"
			/>
		)
	}

	if (isInitialFetch) {
		return <LoadingView />
	}

	if (!data || !data.length) {
		return <NoticeView text="No organizations found." />
	}

	let renderRow = ({item}: {item: StudentOrgType}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={[styles.row]}
			fullWidth={true}
			onPress={() =>
				props.navigation.navigate('StudentOrgsDetailView', {org: item})
			}
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

	return (
		<SearchableAlphabetListView
			cell={renderRow}
			cellHeight={CELL_HEIGHT}
			data={grouped}
			onSearch={setQuery}
			query={query}
			refreshControl={
				<RefreshControl onRefresh={reload} refreshing={isPending} />
			}
			renderSeparator={(sectionId: string, rowId: string) => (
				<ListSeparator
					key={`${sectionId}-${rowId}`}
					spacing={{left: leftSideSpacing}}
				/>
			)}
			sectionHeader={({title}: {title: string}) => (
				<ListSectionHeader
					spacing={{left: leftSideSpacing}}
					style={styles.rowSectionHeader}
					title={title}
				/>
			)}
			sectionHeaderHeight={SECTION_HEADER_HEIGHT}
			style={styles.wrapper}
		/>
	)
}

StudentOrgsView.navigationOptions = {
	title: 'Student Orgs',
	headerBackTitle: 'Orgs',
}
