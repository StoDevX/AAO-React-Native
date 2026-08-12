import * as React from 'react'
import {FlatList, Image, StyleSheet, Text, View} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Column} from '@frogpond/layout'
import {Detail, ListRow, ListSeparator, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {formatResults} from '../../../source/features/directory/helpers'
import {directoryEntriesOptions} from '../../../source/features/directory/query'
import type {
	DirectoryItem,
	DirectorySearchTypeEnum,
} from '../../../source/features/directory/types'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'

function DirectoryView(): React.ReactNode {
	let [searchQueryType, setSearchQueryType] =
		React.useState<DirectorySearchTypeEnum>('query')
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 500)

	let router = useRouter()

	let params = useLocalSearchParams<{
		queryType?: DirectorySearchTypeEnum
		queryParam?: string
	}>()

	let {
		data = {results: []},
		error,
		refetch,
		isError,
		isRefetching,
		isLoading,
	} = useQuery(directoryEntriesOptions(searchQuery, searchQueryType))

	React.useEffect(() => {
		if (params?.queryType === 'department' && params?.queryParam) {
			setSearchQueryType('department')
			setTypedQuery(params.queryParam)
		}
	}, [params?.queryType, params?.queryParam])

	if (!searchQuery) {
		return <NoSearchPerformed />
	}

	if (searchQuery.length < 2) {
		return <NoticeView text="Your search is too short." />
	}

	const items = data.results ? formatResults(data.results) : []

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<Stack.SearchBar
				onChangeText={(event) => {
					setSearchQueryType('query')
					setTypedQuery(event.nativeEvent.text)
				}}
			/>

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
			<Stack.Screen options={{title: params.queryParam ?? 'Directory'}} />
			<DirectoryView />
		</>
	)
}

function IndentedListSeparator() {
	return (
		<ListSeparator spacing={{left: leftMargin + imageSize + imageMargin}} />
	)
}

function NoSearchPerformed() {
	return (
		<View style={styles.emptySearch}>
			<Icon color={c.secondaryLabel} name="people-circle-outline" size={64} />
			<Text style={styles.emptySearchText}>Search the Directory</Text>
		</View>
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
	emptySearch: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptySearchText: {
		fontSize: 18,
		color: c.secondaryLabel,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
})
