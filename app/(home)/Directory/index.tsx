import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useDispatch, useSelector} from 'react-redux'
import {useQuery} from '@tanstack/react-query'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {DisclosureRow} from '../../../source/components/rows'
import {SearchBar} from '../../../source/components/search-bar'
import {
	selectDirectoryResultsView,
	setDirectoryResultsView,
} from '../../../source/redux/parts/settings'
import {contactsOptions} from '../../../source/features/directory/contacts-query'
import {DepartmentsList} from '../../../source/features/directory/departments-list'
import {directoryDepartmentsOptions} from '../../../source/features/directory/departments-query'
import {DirectoryResultsGrid} from '../../../source/features/directory/directory-results-grid'
import {formatResults} from '../../../source/features/directory/helpers'
import {directoryEntriesOptions} from '../../../source/features/directory/query'
import {resolveSearch, searchHeading} from '../../../source/features/directory/resolve-search'
import type {DirectoryItem, DirectorySearchTypeEnum} from '../../../source/features/directory/types'
import {ImportantContactsGrid} from '../../../source/features/directory/important-contacts-grid'

function DirectoryView(): React.ReactNode {
	let router = useRouter()
	let dispatch = useDispatch()
	let resultsView = useSelector(selectDirectoryResultsView)

	let params = useLocalSearchParams<{
		queryType?: DirectorySearchTypeEnum
		queryParam?: string
	}>()

	// Tapping a department opens a fresh copy of this screen with the name
	// already in the params, so the route names the department at mount and the
	// query for it can go out on the first render rather than after a debounce.
	let departmentLink = params?.queryType === 'department' ? params.queryParam : undefined

	let [typedQuery, setTypedQuery] = React.useState('')
	let debouncedQuery = useDebounce(typedQuery, 500)

	let search = resolveSearch({departmentLink, typedQuery: debouncedQuery})
	let {query: searchQuery, type: searchQueryType} = search

	// The title reads "Directory" wherever the screen was opened from, so a
	// linked search names itself over its results instead.
	let heading = searchHeading(search)

	let {
		data = {results: []},
		error,
		refetch,
		isError,
		isLoading,
	} = useQuery(directoryEntriesOptions(searchQuery, searchQueryType))

	let items = data.results ? formatResults(data.results) : []

	// The results toggle only earns toolbar space once there are results to
	// re-lay-out -- it stays hidden on the landing, the too-short notice, the
	// error, and the empty states.
	let hasResults =
		searchQuery.length >= 2 &&
		!isLoading &&
		!(isError && error instanceof Error) &&
		items.length > 0

	// The search chrome is bound to component state (the change handler
	// updates typedQuery), so it can't move to a static outer component.
	// Compute it once and render it in every branch, so the user always has a
	// search bar to type into or clear. It renders last in each branch on
	// purpose -- headerLargeTitleEnabled collapses the title against whichever
	// scrollable mounts above the toolbar, so the scrollable has to come first.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
				<Stack.Toolbar.Spacer />
				{/* Always mounted, hidden until there are results to re-lay-out:
				    `Stack.Toolbar` only reads direct Button/Spacer children, so a
				    conditionally-rendered fragment of them is dropped entirely. */}
				{/* Icon and Label as children rather than an `icon` prop and an
				    `accessibilityLabel`: a bottom-toolbar item drops the latter and
				    lets iOS name it after its symbol, so the button announced
				    itself as "List" rather than saying what tapping it does. */}
				<Stack.Toolbar.Button
					hidden={!hasResults}
					onPress={() =>
						dispatch(setDirectoryResultsView(resultsView === 'tiles' ? 'list' : 'tiles'))
					}
				>
					<Stack.Toolbar.Icon sf={resultsView === 'tiles' ? 'list.bullet' : 'square.grid.2x2'} />
					<Stack.Toolbar.Label>
						{resultsView === 'tiles' ? 'Show as list' : 'Show as tiles'}
					</Stack.Toolbar.Label>
				</Stack.Toolbar.Button>
			</Stack.Toolbar>

			<SearchBar onChangeText={setTypedQuery} value={typedQuery} />
		</>
	)

	if (!searchQuery) {
		return (
			<>
				<DirectoryLanding />
				{searchChrome}
			</>
		)
	}

	if (searchQuery.length < 2) {
		return (
			<>
				<NoticeView text="Your search is too short." />
				{searchChrome}
			</>
		)
	}

	let openResult = (index: number) =>
		router.push({
			pathname: '/Directory/[index]',
			params: {index: String(index), query: searchQuery, type: searchQueryType},
		})

	// The scrollable is the first child, with no wrapping View: a native large
	// title only collapses against a scroll view the stack can see directly,
	// and searchChrome (which ends in the bottom toolbar) comes after it.
	return (
		<>
			{isLoading ? (
				<LoadingView />
			) : isError && error instanceof Error ? (
				<NoticeView text={String(error)} />
			) : !items.length ? (
				<NoticeView text={`No results found for "${searchQuery}".`} />
			) : resultsView === 'tiles' ? (
				<DirectoryResultsGrid
					heading={heading}
					items={items}
					onRefresh={refetch}
					onSelectIndex={openResult}
				/>
			) : (
				<Host matchContents={false} style={styles.host}>
					<List
						modifiers={[
							listStyle('insetGrouped'),
							refreshable(async () => {
								await refetch()
							}),
						]}
					>
						<Section title={heading ?? undefined}>
							{items.map((item, index) => (
								<DirectoryItemRow
									key={index}
									index={index}
									item={item}
									onPress={() => openResult(index)}
								/>
							))}
						</Section>
					</List>
				</Host>
			)}
			{searchChrome}
		</>
	)
}

export default function DirectoryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{headerLargeTitleEnabled: true}} />
			<Stack.Title>Directory</Stack.Title>
			<DirectoryView />
		</>
	)
}

/**
 * What the Directory screen shows before a search: the curated campus contacts
 * as tiles, and the full campus department roster as an inset-grouped list.
 *
 * Both queries are cached to disk by `PersistQueryClientProvider`, so a device
 * that opens this offline still gets both. A failed refresh over good caches is
 * absorbed -- searching, which is this screen's real job, depends on neither.
 */
function DirectoryLanding(): React.ReactNode {
	let router = useRouter()
	let contacts = useQuery(contactsOptions)
	let {
		data: departments,
		isLoading: departmentsLoading,
		refetch: refetchDepartments,
	} = useQuery(directoryDepartmentsOptions)

	let refreshContacts = contacts.refetch
	let refresh = React.useCallback(async () => {
		await Promise.all([refreshContacts(), refetchDepartments()])
	}, [refreshContacts, refetchDepartments])

	return (
		<Host matchContents={false} style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refresh()
					}),
				]}
			>
				<ImportantContactsGrid
					query={contacts}
					onSelectContact={(contact) => {
						router.push({
							pathname: '/Directory/named/[title]',
							params: {title: contact.title},
						})
					}}
				/>

				<DepartmentsList
					departments={departments}
					isLoading={departmentsLoading}
					onSelectDepartment={(name) =>
						router.push({
							pathname: '/Directory',
							params: {queryType: 'department', queryParam: name},
						})
					}
				/>
			</List>
		</Host>
	)
}

/**
 * Every result row carries this prefix so XCUITest can ask whether the list
 * has any rows without naming someone the college can rename. Mirror it in
 * `TestIdentifiers.Directory`.
 */
const DIRECTORY_ROW_PREFIX = 'directory-row-'

type DirectoryItemRowProps = {
	item: DirectoryItem
	index: number
	onPress: () => void
}

function DirectoryItemRow({item, index, onPress}: DirectoryItemRowProps) {
	return (
		<DisclosureRow
			detail={[item.description]}
			detailLines={1}
			identifier={`${DIRECTORY_ROW_PREFIX}${index}`}
			image={{uri: item.thumbnail, width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}}
			onPress={onPress}
			title={item.displayName}
		/>
	)
}

/// The face beside each result, at the size the row list has always drawn it.
const THUMBNAIL_SIZE = 35

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
