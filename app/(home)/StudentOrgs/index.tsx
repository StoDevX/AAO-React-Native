// app/(home)/StudentOrgs/index.tsx
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, ScrollView, VStack} from '@expo/ui/swift-ui'
import {frame, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Stack, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {useQuery} from '@tanstack/react-query'
import {categoryMembershipsOptions} from '../../../source/features/student-orgs/category-memberships-query'
import {orgCategoryIconsOptions} from '../../../source/features/student-orgs/category-icons-query'
import {
	buildCategoryTiles,
	type CategoryTileData,
} from '../../../source/features/student-orgs/categories'
import {CategoryTile} from '../../../source/features/student-orgs/category-tile'
import {OrgResultsList} from '../../../source/features/student-orgs/org-results-list'
import {studentOrgsOptions} from '../../../source/features/student-orgs/query'
import {filterAndGroupOrgs} from '../../../source/features/student-orgs/search'
import type {StudentOrgType} from '../../../source/features/student-orgs/types'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../../source/components/tile-layout'
import {TileGrid} from '../../../source/components/tile-grid'
import {SearchBar} from '../../../source/components/search-bar'

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

	let tiles = React.useMemo(
		() => buildCategoryTiles(categoryIcons, memberships),
		[categoryIcons, memberships],
	)
	let sections = React.useMemo(() => filterAndGroupOrgs(orgs, searchQuery), [orgs, searchQuery])

	let refreshTiles = React.useCallback(async () => {
		await Promise.all([refetchMemberships(), refetchCategoryIcons()])
	}, [refetchMemberships, refetchCategoryIcons])

	let onPressOrg = React.useCallback(
		(org: StudentOrgType) =>
			router.navigate({
				pathname: '/StudentOrgs/[name]',
				params: {name: org.name},
			}),
		[router],
	)

	let onSelectCategory = React.useCallback(
		(category: string) =>
			router.navigate({
				pathname: '/StudentOrgs/category/[category]',
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
		// The tile grid only depends on the lightweight memberships + curated
		// icon queries -- the full org list loads in parallel for whenever a
		// search actually happens, but never blocks the tiles from showing.
		if (isMembershipsError) {
			let message =
				membershipsError instanceof Error ? membershipsError.message : String(membershipsError)
			return (
				<>
					{searchChrome}
					<NoticeView
						buttonText="Try Again"
						onPress={refetchMemberships}
						text={`A problem occurred while loading: ${message}`}
					/>
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
					onRefresh={refreshTiles}
					onSelectCategory={onSelectCategory}
					tiles={tiles}
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
				<NoticeView
					buttonText="Try Again"
					onPress={refetchOrgs}
					text={`A problem occurred while loading: ${message}`}
				/>
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

/// Mirrored by TestIdentifiers.StudentOrgs.categoryGrid.
const CATEGORY_GRID_ID = 'student-orgs-category-grid'

type LandingProps = {
	tiles: CategoryTileData[]
	onSelectCategory: (category: string) => void
	onRefresh: () => Promise<unknown>
}

/**
 * The Student Orgs landing screen before a search: category tiles in a
 * scrolling grid. Structured like directory-results-grid.tsx -- `Grid`
 * itself does not scroll, so this needs its own `ScrollView`, unlike
 * Directory's *other* landing (`DirectoryLanding`), which gets scrolling for
 * free by sitting inside a `List` alongside the departments below it. This
 * screen has nothing below the tiles, so there is no `List` to borrow one
 * from.
 */
function StudentOrgsLanding({tiles, onSelectCategory, onRefresh}: LandingProps): React.ReactNode {
	return (
		<Host matchContents={false} style={styles.host}>
			<ScrollView
				modifiers={[
					refreshable(async () => {
						await onRefresh()
					}),
				]}
			>
				<VStack
					alignment="leading"
					modifiers={[
						padding({leading: SCREEN_MARGIN, trailing: SCREEN_MARGIN, top: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={TILE_SPACING}
				>
					<TileGrid
						accessibilityId={CATEGORY_GRID_ID}
						items={tiles}
						keyForItem={(tile) => tile.name}
						renderItem={(tile) => (
							<CategoryTile onPress={() => onSelectCategory(tile.name)} tile={tile} />
						)}
					/>
				</VStack>
			</ScrollView>
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
