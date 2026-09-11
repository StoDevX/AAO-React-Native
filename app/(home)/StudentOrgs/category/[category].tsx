// app/(home)/StudentOrgs/category/[category].tsx
import * as React from 'react'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {useQuery} from '@tanstack/react-query'
import {orgsInCategory} from '../../../../source/features/student-orgs/categories'
import {categoryMembershipsOptions} from '../../../../source/features/student-orgs/category-memberships-query'
import {OrgResultsList} from '../../../../source/features/student-orgs/org-results-list'
import {studentOrgsOptions} from '../../../../source/features/student-orgs/query'
import {filterAndGroupOrgs} from '../../../../source/features/student-orgs/search'
import type {StudentOrgType} from '../../../../source/features/student-orgs/types'
import {SearchBar} from '../../../../source/components/search-bar'

function CategoryOrgsView(): React.ReactNode {
	let {category} = useLocalSearchParams<{category: string}>()
	let router = useRouter()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data: orgs = [], error, isError, refetch, isLoading} = useQuery(studentOrgsOptions)
	let {
		data: memberships = [],
		error: membershipsError,
		isError: isMembershipsError,
		refetch: refetchMemberships,
		isLoading: isMembershipsLoading,
	} = useQuery(categoryMembershipsOptions)

	let categoryOrgs = React.useMemo(() => {
		let membership = memberships.find((entry) => entry.name === category)
		return membership ? orgsInCategory(orgs, membership) : []
	}, [orgs, memberships, category])

	let sections = React.useMemo(
		() => filterAndGroupOrgs(categoryOrgs, searchQuery),
		[categoryOrgs, searchQuery],
	)

	let refresh = React.useCallback(async () => {
		await Promise.all([refetch(), refetchMemberships()])
	}, [refetch, refetchMemberships])

	let onPressOrg = React.useCallback(
		(org: StudentOrgType) =>
			router.push({
				pathname: '/StudentOrgs/[name]',
				params: {name: org.name},
			}),
		[router],
	)

	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />
		</>
	)

	if (isError || isMembershipsError) {
		return (
			<>
				{searchChrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refresh}
					text={`A problem occured while loading: ${error ?? membershipsError}`}
				/>
			</>
		)
	}

	if (isLoading || isMembershipsLoading) {
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
			<OrgResultsList
				emptyText={
					searchQuery
						? `No results found for "${searchQuery}".`
						: `No organizations found in "${category}".`
				}
				onPressOrg={onPressOrg}
				onRefresh={refresh}
				sections={sections}
			/>
		</>
	)
}

export default function StudentOrgCategoryPage(): React.ReactNode {
	let {category} = useLocalSearchParams<{category: string}>()

	return (
		<>
			<Stack.Title>{category}</Stack.Title>
			<CategoryOrgsView />
		</>
	)
}
