// app/student-orgs/index.tsx
import * as React from 'react'
import {LoadErrorView, LoadingView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {useQuery} from '@tanstack/react-query'
import {categoryMembershipsOptions} from '../../source/features/student-orgs/category-memberships-query'
import {orgCategoryIconsOptions} from '../../source/features/student-orgs/category-icons-query'
import {buildCategoryRows} from '../../source/features/student-orgs/categories'
import {CategoryLanding} from '../../source/features/student-orgs/category-landing'
import {useCategoryLayoutStore} from '../../source/features/student-orgs/store'
import {OrgResultsList} from '../../source/features/student-orgs/org-results-list'
import {studentOrgsOptions} from '../../source/features/student-orgs/query'
import {filterAndGroupOrgs} from '../../source/features/student-orgs/search'
import type {StudentOrgType} from '../../source/features/student-orgs/types'
import {LayoutMenu} from '../../source/components/layout-menu'
import {SearchBar} from '../../source/components/search-bar'

function StudentOrgsView(): React.ReactNode {
	let router = useRouter()

	let layout = useCategoryLayoutStore((state) => state.layout)
	let setLayout = useCategoryLayoutStore((state) => state.setLayout)

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data: memberships = [],
		error: membershipsError,
		isError: isMembershipsError,
		refetch: refetchMemberships,
		isLoading: isMembershipsLoading,
	} = useQuery(categoryMembershipsOptions)
	let {data: categoryIcons = [], refetch: refetchCategoryIcons} = useQuery(orgCategoryIconsOptions)
	let {
		data: orgs = [],
		error: orgsError,
		isError: isOrgsError,
		refetch: refetchOrgs,
		isLoading: isOrgsLoading,
	} = useQuery(studentOrgsOptions)

	let categories = React.useMemo(
		() => buildCategoryRows(categoryIcons, memberships),
		[categoryIcons, memberships],
	)
	let sections = React.useMemo(() => filterAndGroupOrgs(orgs, searchQuery), [orgs, searchQuery])

	let refreshCategories = React.useCallback(async () => {
		await Promise.all([refetchMemberships(), refetchCategoryIcons()])
	}, [refetchMemberships, refetchCategoryIcons])

	let onPressOrg = React.useCallback(
		(org: StudentOrgType) =>
			router.navigate({
				pathname: '/student-orgs/[name]',
				params: {name: org.name},
			}),
		[router],
	)

	let onSelectCategory = React.useCallback(
		(category: string) =>
			router.navigate({
				pathname: '/student-orgs/category/[category]',
				params: {category},
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
			{/* Search results are always rows, so the menu goes while they show. */}
			{searchQuery ? null : <LayoutMenu layout={layout} onChange={setLayout} />}
		</>
	)

	if (!searchQuery) {
		// The category list only depends on the lightweight memberships + curated
		// icon queries -- the full org list loads in parallel for whenever a
		// search actually happens, but never blocks the categories from showing.
		if (isMembershipsError) {
			let message =
				membershipsError instanceof Error ? membershipsError.message : String(membershipsError)
			return (
				<>
					{searchChrome}
					<LoadErrorView error={message} onRetry={refetchMemberships} />
				</>
			)
		}

		if (isMembershipsLoading) {
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
				<CategoryLanding
					categories={categories}
					layout={layout}
					onRefresh={refreshCategories}
					onSelectCategory={onSelectCategory}
				/>
			</>
		)
	}

	// Search spans every org, so this branch depends on the full org list.
	if (isOrgsError) {
		let message = orgsError instanceof Error ? orgsError.message : String(orgsError)
		return (
			<>
				{searchChrome}
				<LoadErrorView error={message} onRetry={refetchOrgs} />
			</>
		)
	}

	if (isOrgsLoading) {
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
				emptyText={`No results found for "${searchQuery}".`}
				onPressOrg={onPressOrg}
				onRefresh={refetchOrgs}
				query={searchQuery}
				sections={sections}
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
