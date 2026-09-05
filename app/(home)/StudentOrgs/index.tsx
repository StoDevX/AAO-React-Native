import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {Column} from '@frogpond/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
	largeListProps,
	emptyList,
} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import type {StudentOrgType} from '../../../source/features/student-orgs/types'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useRouter} from 'expo-router'
import memoize from 'lodash/memoize'
import {studentOrgsOptions} from '../../../source/features/student-orgs/query'
import {useQuery} from '@tanstack/react-query'
import {SearchBar} from '../../../source/components/search-bar'

const splitToArray = memoize((str: string) => words(deburr(str.toLowerCase())))

const orgToArray = memoize((term: StudentOrgType) =>
	Array.from(
		new Set([
			...splitToArray(term.name),
			...splitToArray(term.category),
			...splitToArray(term.description),
		]),
	),
)

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function StudentOrgsView(): React.ReactNode {
	let router = useRouter()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data: orgs = [],
		error,
		isError,
		refetch,
		isRefetching,
		isLoading,
	} = useQuery(studentOrgsOptions)

	let results = React.useMemo(() => {
		if (!orgs) {
			return emptyList
		}

		if (!searchQuery) {
			return orgs
		}

		return orgs.filter((org) => orgToArray(org).some((word) => word.startsWith(searchQuery)))
	}, [orgs, searchQuery])

	let grouped = React.useMemo(() => {
		return toPairs(groupBy(results, '$groupableName')).map(([k, v]) => {
			return {title: k, data: v}
		})
	}, [results])

	let onPressOrg = React.useCallback(
		(org: StudentOrgType) =>
			router.push({
				pathname: '/StudentOrgs/[name]',
				params: {name: org.name},
			}),
		[router],
	)

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component.
	// Compute it once and render it in every branch, so the user always
	// has a search bar to type into or clear.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />
		</>
	)

	if (isError) {
		return (
			<>
				{searchChrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			</>
		)
	}

	return (
		<>
			{searchChrome}

			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					searchQuery ? (
						<NoticeView text={`No results found for "${searchQuery}"`} />
					) : isLoading ? (
						<LoadingView />
					) : (
						<NoticeView text="No organizations found." />
					)
				}
				contentContainerStyle={styles.contentContainer}
				contentInsetAdjustmentBehavior="automatic"
				keyExtractor={(item) => item.name + item.category}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="never"
				onRefresh={refetch}
				refreshing={isRefetching}
				renderItem={({item}) => (
					<ListRow arrowPosition="top" onPress={() => onPressOrg(item)}>
						<Column flex={1}>
							<Title lines={1}>{item.name}</Title>
							<Detail lines={1}>{item.category}</Detail>
						</Column>
					</ListRow>
				)}
				renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
				sections={grouped}
				style={styles.wrapper}
				{...largeListProps}
			/>
		</>
	)
}

export default function StudentOrgsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Student Orgs</Stack.Title>
			<StudentOrgsView />
		</>
	)
}
