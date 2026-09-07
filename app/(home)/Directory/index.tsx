import * as React from 'react'
import {Alert, FlatList, Image, StyleSheet, useWindowDimensions, View} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useDispatch, useSelector} from 'react-redux'
import {useQuery} from '@tanstack/react-query'
import {
	Button,
	Grid,
	HStack,
	Host,
	Image as UIImage,
	List,
	ProgressView,
	Spacer,
	Text as UIText,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	padding,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import {Column} from '@frogpond/layout'
import {Detail, ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
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
import {ContactTile} from '../../../source/features/directory/tile'
import {
	columnsForFontScale,
	inRows,
	TILE_SPACING,
} from '../../../source/features/directory/tile-layout'
import type {DirectoryItem, DirectorySearchTypeEnum} from '../../../source/features/directory/types'
import {FILL_WIDTH, SCREEN_MARGIN} from '../../../source/features/home/button'

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
		isRefetching,
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
				{hasResults ? (
					<>
						<Stack.Toolbar.Spacer />
						<Stack.Toolbar.Button
							accessibilityLabel={resultsView === 'tiles' ? 'Show as list' : 'Show as tiles'}
							icon={resultsView === 'tiles' ? 'list.bullet' : 'square.grid.2x2'}
							onPress={() =>
								dispatch(setDirectoryResultsView(resultsView === 'tiles' ? 'list' : 'tiles'))
							}
						/>
					</>
				) : null}
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

	return (
		<>
			<View style={styles.wrapper}>
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
					<FlatList
						ItemSeparatorComponent={IndentedListSeparator}
						ListHeaderComponent={heading ? <ListSectionHeader title={heading} /> : null}
						contentInsetAdjustmentBehavior="automatic"
						data={items}
						keyExtractor={(_item, index) => String(index)}
						keyboardDismissMode="on-drag"
						keyboardShouldPersistTaps="never"
						onRefresh={refetch}
						refreshing={isRefetching}
						renderItem={({item, index}) => (
							<DirectoryItemRow index={index} item={item} onPress={() => openResult(index)} />
						)}
					/>
				)}
			</View>
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

function IndentedListSeparator() {
	return <ListSeparator spacing={{left: leftMargin + imageSize + imageMargin}} />
}

/// Mirrored by TestIdentifiers.Directory.contactGrid.
const CONTACT_GRID_ID = 'directory-contact-grid'
const STALE_CONTACTS_LABEL = 'Contacts may be out of date'

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
	let {
		data: contacts,
		error: contactsError,
		isLoading: contactsLoading,
		refetch: refetchContacts,
	} = useQuery(contactsOptions)
	let {
		data: departments,
		isLoading: departmentsLoading,
		refetch: refetchDepartments,
	} = useQuery(directoryDepartmentsOptions)
	let {fontScale} = useWindowDimensions()
	let columns = columnsForFontScale(fontScale)

	let showContactsError = React.useCallback(() => {
		Alert.alert(
			"Couldn't refresh contacts",
			contactsError instanceof Error ? contactsError.message : 'Unknown error',
			[
				{text: 'Try Again', onPress: () => void refetchContacts()},
				{text: 'OK', style: 'cancel'},
			],
		)
	}, [contactsError, refetchContacts])

	let refresh = React.useCallback(async () => {
		await Promise.all([refetchContacts(), refetchDepartments()])
	}, [refetchContacts, refetchDepartments])

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
				<VStack
					modifiers={[
						listRowBackground('clear'),
						listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
						listRowSeparator('hidden'),
						// Horizontal + top only: the enclosing List owns the gap down
						// to the Departments section below.
						padding({horizontal: SCREEN_MARGIN, top: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={TILE_SPACING}
				>
					<HStack modifiers={[frame({maxWidth: FILL_WIDTH})]}>
						<UIText modifiers={[font({textStyle: 'headline'})]}>Important Contacts</UIText>
						<Spacer />
						{contactsError && contacts ? (
							<Button
								modifiers={[buttonStyle('plain'), accessibilityLabel(STALE_CONTACTS_LABEL)]}
								onPress={showContactsError}
							>
								<UIImage color={c.orange} systemName="exclamationmark.triangle.fill" />
							</Button>
						) : null}
					</HStack>

					{contacts ? (
						<Grid
							alignment="top"
							horizontalSpacing={TILE_SPACING}
							// The Grid itself carries no accessibility presence of its
							// own, so accessibilityIdentifier alone lands on its first
							// button descendant instead of the grid -- contain() gives it
							// one, keeping the tiles as its individually-navigable
							// children, which is what a UI test counting them needs.
							modifiers={[
								accessibilityElement('contain'),
								accessibilityIdentifier(CONTACT_GRID_ID),
							]}
							verticalSpacing={TILE_SPACING}
						>
							{inRows(contacts, columns).map((row, i) => (
								<Grid.Row key={i}>
									{row.map((contact) => (
										<ContactTile
											key={contact.title}
											contact={contact}
											onPress={() =>
												router.push({
													pathname: '/Directory/named/[title]',
													params: {title: contact.title},
												})
											}
										/>
									))}
									{/* A short last row leaves its columns empty rather than
									    stretching the tiles in it. 8 contacts divide evenly by
									    4 and 2 columns but not by 3, so this padding matters at
									    every column count, not just the edge cases. */}
									{Array.from({length: columns - row.length}, (_, j) => (
										<Spacer key={j} />
									))}
								</Grid.Row>
							))}
						</Grid>
					) : contactsLoading ? (
						<ProgressView />
					) : (
						<UIText modifiers={[foregroundStyle(c.secondaryLabel)]}>
							Contacts are unavailable. Pull to try again.
						</UIText>
					)}
				</VStack>

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

function IosDirectoryItemRow({item, index, onPress}: DirectoryItemRowProps) {
	return (
		<ListRow
			fullWidth={true}
			onPress={onPress}
			style={styles.row}
			testID={`${DIRECTORY_ROW_PREFIX}${index}`}
		>
			<Image source={{uri: item.thumbnail}} style={styles.image} />
			<Column flex={1}>
				<Title lines={1}>{item.displayName}</Title>
				<Detail lines={1}>{item.description}</Detail>
			</Column>
		</ListRow>
	)
}

const DirectoryItemRow = IosDirectoryItemRow

const leftMargin = 15
const imageSize = 35
const imageMargin = 10
const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	image: {
		resizeMode: 'cover',
		width: imageSize,
		height: imageSize,
		borderRadius: 4,
		marginRight: imageMargin,
		marginLeft: leftMargin,
	},
	host: {
		flex: 1,
	},
})
