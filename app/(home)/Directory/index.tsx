import * as React from 'react'
import {Alert, FlatList, Image, StyleSheet, useWindowDimensions, View} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {
	Button,
	Grid,
	HStack,
	Host,
	Image as UIImage,
	ProgressView,
	ScrollView,
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
	padding,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import {Column} from '@frogpond/layout'
import {Detail, ListRow, ListSeparator, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../../source/components/call-phone'
import {SearchBar} from '../../../source/components/search-bar'
import {contactsOptions} from '../../../source/features/directory/contacts-query'
import {formatResults} from '../../../source/features/directory/helpers'
import {directoryEntriesOptions} from '../../../source/features/directory/query'
import {
	columnsForFontScale,
	ContactTile,
	TILE_SPACING,
} from '../../../source/features/directory/tile'
import type {
	ContactType,
	DirectoryItem,
	DirectorySearchTypeEnum,
} from '../../../source/features/directory/types'
import {FILL_WIDTH, SCREEN_MARGIN} from '../../../source/features/home/button'

function DirectoryView(): React.ReactNode {
	let router = useRouter()

	let params = useLocalSearchParams<{
		queryType?: DirectorySearchTypeEnum
		queryParam?: string
	}>()

	// Tapping a department opens a fresh copy of this screen with the name
	// already in the params, so they seed the search: the route names the
	// department at mount, and the query for it can go out on the first render
	// rather than after a debounce.
	let departmentLink = params?.queryType === 'department' ? params.queryParam : undefined

	let [searchQueryType, setSearchQueryType] = React.useState<DirectorySearchTypeEnum>(
		departmentLink ? 'department' : 'query',
	)
	let [typedQuery, setTypedQuery] = React.useState(departmentLink ?? '')
	let searchQuery = useDebounce(typedQuery, 500)

	let {
		data = {results: []},
		error,
		refetch,
		isError,
		isRefetching,
		isLoading,
	} = useQuery(directoryEntriesOptions(searchQuery, searchQueryType))

	// The search chrome is bound to component state (the change handler
	// updates typedQuery/searchQueryType), so it can't move to a static
	// outer component. Compute it once and render it in every branch, so
	// the user always has a search bar to type into or clear.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar
				onChangeText={(text) => {
					setSearchQueryType('query')
					setTypedQuery(text)
				}}
				value={typedQuery}
			/>
		</>
	)

	if (!searchQuery) {
		return (
			<>
				{searchChrome}
				<ImportantContacts />
			</>
		)
	}

	if (searchQuery.length < 2) {
		return (
			<>
				{searchChrome}
				<NoticeView text="Your search is too short." />
			</>
		)
	}

	const items = data.results ? formatResults(data.results) : []

	return (
		<>
			{searchChrome}

			<View style={styles.wrapper}>
				{isLoading ? (
					<LoadingView />
				) : isError && error instanceof Error ? (
					<NoticeView text={String(error)} />
				) : !items.length ? (
					<NoticeView text={`No results found for "${searchQuery}".`} />
				) : (
					<FlatList
						ItemSeparatorComponent={IndentedListSeparator}
						contentInsetAdjustmentBehavior="automatic"
						data={items}
						keyExtractor={(_item, index) => String(index)}
						keyboardDismissMode="on-drag"
						keyboardShouldPersistTaps="never"
						onRefresh={refetch}
						refreshing={isRefetching}
						renderItem={({item, index}) => (
							<DirectoryItemRow
								item={item}
								onPress={() =>
									router.push({
										pathname: '/Directory/[index]',
										params: {
											index: String(index),
											query: searchQuery,
											type: searchQueryType,
										},
									})
								}
							/>
						)}
					/>
				)}
			</View>
		</>
	)
}

export default function DirectoryPage(): React.ReactNode {
	let params = useLocalSearchParams<{queryParam?: string}>()

	return (
		<>
			<Stack.Title>{params.queryParam ?? 'Directory'}</Stack.Title>
			<DirectoryView />
		</>
	)
}

function IndentedListSeparator() {
	return <ListSeparator spacing={{left: leftMargin + imageSize + imageMargin}} />
}

/// Mirrored by TestIdentifiers.Directory.contactGrid.
const CONTACT_GRID_ID = 'directory-contact-grid'
/// Mirrored by TestIdentifiers.Directory.staleContacts.
const STALE_CONTACTS_LABEL = 'Contacts may be out of date'

/// Groups the contacts into the rows a SwiftUI Grid wants: its API takes
/// children pre-split into `Grid.Row`s rather than a flat list. `columns`
/// varies with Dynamic Type (see `columnsForFontScale`), so it is a parameter
/// rather than a closed-over constant.
function inRows(contacts: ContactType[], columns: number): ContactType[][] {
	let rows: ContactType[][] = []
	for (let i = 0; i < contacts.length; i += columns) {
		rows.push(contacts.slice(i, i + columns))
	}
	return rows
}

/**
 * What the Directory screen shows before a search: the curated campus
 * contacts, as tiles.
 *
 * The contacts are cached to disk by `PersistQueryClientProvider`, so a device
 * that opens this offline still gets the grid. A failed refresh over a good
 * cache is a badge beside the heading rather than an error page -- searching,
 * which is this screen's real job, does not depend on it.
 */
function ImportantContacts(): React.ReactNode {
	let router = useRouter()
	let {data: contacts, error, isLoading, refetch} = useQuery(contactsOptions)
	let {fontScale} = useWindowDimensions()
	let columns = columnsForFontScale(fontScale)

	let onAct = React.useCallback((contact: ContactType) => {
		if (contact.buttonLink) {
			openUrl(contact.buttonLink)
		} else if (contact.phoneNumber) {
			callPhone(contact.phoneNumber, {title: contact.buttonText})
		}
	}, [])

	let showError = React.useCallback(() => {
		Alert.alert(
			"Couldn't refresh contacts",
			error instanceof Error ? error.message : 'Unknown error',
			[
				{text: 'Try Again', onPress: () => void refetch()},
				{text: 'OK', style: 'cancel'},
			],
		)
	}, [error, refetch])

	return (
		<Host matchContents={false} style={styles.host}>
			<ScrollView
				modifiers={[
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				<VStack
					modifiers={[padding({all: SCREEN_MARGIN}), frame({maxWidth: FILL_WIDTH})]}
					spacing={TILE_SPACING}
				>
					<HStack modifiers={[frame({maxWidth: FILL_WIDTH})]}>
						<UIText modifiers={[font({textStyle: 'headline'})]}>Important Contacts</UIText>
						<Spacer />
						{error && contacts ? (
							<Button
								modifiers={[buttonStyle('plain'), accessibilityLabel(STALE_CONTACTS_LABEL)]}
								onPress={showError}
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
											onAct={() => onAct(contact)}
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
					) : isLoading ? (
						<ProgressView />
					) : (
						<UIText modifiers={[foregroundStyle(c.secondaryLabel)]}>
							Contacts are unavailable. Pull to try again.
						</UIText>
					)}
				</VStack>
			</ScrollView>
		</Host>
	)
}

type DirectoryItemRowProps = {
	item: DirectoryItem
	onPress: () => void
}

function IosDirectoryItemRow({item, onPress}: DirectoryItemRowProps) {
	return (
		<ListRow fullWidth={true} onPress={onPress} style={styles.row}>
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
