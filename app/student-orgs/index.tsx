// app/student-orgs/index.tsx
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {LoadErrorView, LoadingView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Stack, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {useQuery} from '@tanstack/react-query'
import {categoryMembershipsOptions} from '../../source/features/student-orgs/category-memberships-query'
import {orgCategoryIconsOptions} from '../../source/features/student-orgs/category-icons-query'
import {
	buildCategoryRows,
	type CategoryRowData,
} from '../../source/features/student-orgs/categories'
import {OrgResultsList} from '../../source/features/student-orgs/org-results-list'
import {studentOrgsOptions} from '../../source/features/student-orgs/query'
import {filterAndGroupOrgs} from '../../source/features/student-orgs/search'
import type {StudentOrgType} from '../../source/features/student-orgs/types'
import {DisclosureRow} from '../../source/components/rows'
import {SearchBar} from '../../source/components/search-bar'

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
				<StudentOrgsLanding
					categories={categories}
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

/// Mirrored by TestIdentifiers.StudentOrgs.categoryList.
const CATEGORY_LIST_ID = 'student-orgs-category-list'

/// Prefixes each category row's identifier; mirrored by
/// TestIdentifiers.StudentOrgs.categoryRowPrefix. The name follows it, so a
/// UI test can tell which category it tapped without parsing the row's
/// spoken label, which ends in the org count.
const CATEGORY_ROW_ID_PREFIX = 'student-orgs-category:'

/// Enough that no category name is cut off at any text size: the longest,
/// "Student-Led Campus Organizations", wraps to five lines at AX5. The names
/// are a short curated set, so a long one cannot crowd the list.
const CATEGORY_NAME_LINES = 5

type LandingProps = {
	categories: CategoryRowData[]
	onSelectCategory: (category: string) => void
	onRefresh: () => Promise<unknown>
}

/**
 * The Student Orgs landing screen before a search: one row per category,
 * with its icon and how many orgs it holds.
 */
function StudentOrgsLanding({
	categories,
	onSelectCategory,
	onRefresh,
}: LandingProps): React.ReactNode {
	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await onRefresh()
					}),
					accessibilityIdentifier(CATEGORY_LIST_ID),
				]}
			>
				<Section>
					{categories.map((category) => (
						<DisclosureRow
							key={category.name}
							badge={category.count}
							identifier={`${CATEGORY_ROW_ID_PREFIX}${category.name}`}
							image={{systemName: category.icon, gradient: category.gradient}}
							onPress={() => onSelectCategory(category.name)}
							title={category.name}
							titleLines={CATEGORY_NAME_LINES}
						/>
					))}
				</Section>
			</List>
		</Host>
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
