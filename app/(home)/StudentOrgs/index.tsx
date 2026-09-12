import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {emptyList} from '@frogpond/lists'
import {DisclosureRow} from '../../../source/components/rows'
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
import {sectionIndexLabel} from '../../../source/lib/section-index-label'

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
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

function StudentOrgsView(): React.ReactNode {
	let router = useRouter()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data: orgs = [], error, isError, refetch, isLoading} = useQuery(studentOrgsOptions)

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

	if (isLoading) {
		return (
			<>
				{searchChrome}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{searchChrome}

			<Host style={styles.host}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						refreshable(async () => {
							await refetch()
						}),
						accessibilityIdentifier('student-orgs-list'),
					]}
				>
					{grouped.length === 0 ? (
						<ContentUnavailableView
							systemImage="person.3"
							title={
								searchQuery ? `No results found for "${searchQuery}"` : 'No organizations found.'
							}
						/>
					) : (
						grouped.map((section) => (
							<Section
								key={section.title}
								modifiers={[sectionIndexLabel(section.title)]}
								title={section.title}
							>
								{section.data.map((org) => (
									<DisclosureRow
										key={org.name + org.category}
										detail={org.category}
										detailLines={1}
										onPress={() => onPressOrg(org)}
										title={org.name}
									/>
								))}
							</Section>
						))
					)}
				</List>
			</Host>
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
