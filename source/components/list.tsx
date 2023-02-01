import React, {useMemo} from 'react'

import {ContextMenu} from '@frogpond/context-menu'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {
	FlatList,
	SectionList,
	StyleSheet,
	Text,
	VirtualizedListWithoutRenderItemProps,
} from 'react-native'
import {ChangeTextEvent} from '../navigation/types'

type FlatData<T> = ({key: string} & T)[]

type Props<T extends {key: string}, E extends Error> = {
	/** The `useQuery` query that represents the data to render */
	query: UseQueryResult<FlatData<T>, E>
	/** Any keys of the data objects that should be searched with FTS */
	searchInKeys?: ReadonlyArray<keyof T>
	/** Which key, if any, of the data to group by */
	groupByKey?: keyof T
	/** Which keys, if any, to expose as a filter toolbar */
	filterByKeys?: ReadonlyArray<keyof T>
	/** How to render the list rows */
	renderItem: ({item}: {item: T}) => JSX.Element
}

const styles = StyleSheet.create({
	wrapper: {flex: 1},
	contentContainer: {flexGrow: 1},
	rowDetailText: {fontSize: 14},
})

const EMPTY_LIST: readonly never[] = []

export function Row(props: {
	item: {title: string; detail: string}
	onPress: () => unknown
}): JSX.Element {
	let {item, onPress} = props

	return (
		<ListRow arrowPosition="top" onPress={onPress}>
			<Title lines={1}>{item.title}</Title>
			<Detail lines={2} style={styles.rowDetailText}>
				{item.detail}
			</Detail>
		</ListRow>
	)
}

// .filter(record => filterByKeys?.every(key => {
//     let value = record[key]
//     if (typeof value === 'object') {
//         return isEmpty(value)
//     } else {
//         return Boolean(value)
//     }
// }))

/**
 * List will return either a FlatList or a SectionList, depending on
 */
export function List<T extends {key: string}, E extends Error>(
	props: Props<T, E>,
): JSX.Element {
	let {
		query,
		searchInKeys,
		filterByKeys: _filterByKeys,
		groupByKey,
		renderItem,
	} = props

	let navigation = useNavigation()
	let [searchQuery, setSearchQuery] = React.useState('')

	React.useLayoutEffect(() => {
		let options: NativeStackNavigationOptions = {
			headerSearchBarOptions: {
				// barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setSearchQuery(event.nativeEvent.text),
			},
			headerRight() {
				return (
					<ContextMenu
						actions={['a', 'b', 'c']}
						disabled={false}
						isMenuPrimaryAction={true}
						onPressMenuItem={(key: string) => console.log(`key: ${key}`)}
						title="Group"
					>
						<Text>Group</Text>
					</ContextMenu>
				)
			},
		}
		navigation.setOptions(options)
	}, [navigation])

	let {data, error, refetch, isLoading, isError, isRefetching} = query

	// let filters = useMemo(() => {
	// 	return (
	// 		filterByKeys?.map((key) => {
	// 			return {
	// 				key,
	// 				values: Array.from(
	// 					new Set(
	// 						data?.flatMap((record) => {
	// 							let value = record[key]
	// 							if (Array.isArray(value)) {
	// 								return value
	// 							} else {
	// 								return value
	// 							}
	// 						}) ?? [],
	// 					),
	// 				).sort(),
	// 			}
	// 		}) ?? []
	// 	)
	// }, [data, filterByKeys])

	// We want to support plain-text search, key:value matches, and
	// auto-grouping by object property.

	// `category:athletics sport:football is:home`
	// [Athletics]

	/**
	 * If there's data and some keys have been configured for search,
	 * search those keys and return results which have matches.
	 *
	 *
	 */
	let searched = useMemo(() => {
		if (!data) {
			return EMPTY_LIST
		}
		if (!searchQuery || !searchInKeys) {
			return data
		}

		// make TS happy that this variable won't be re-bound
		let keysToSearch = searchInKeys
		return data?.filter((record) =>
			keysToSearch.some((key) => String(record[key]).includes(searchQuery)),
		)
	}, [data, searchQuery, searchInKeys])

	// TODO: come back to filters
	// let filtered = useMemo(() => {
	// 	if (!data) {
	// 		return EMPTY_LIST
	// 	}
	// 	if (!filterByKeys) {
	// 		return data
	// 	}
	//
	// 	// make TS happy that this variable won't be re-bound
	// 	let keysToFilter = filterByKeys
	// 	return data?.filter((record) =>
	// 		keysToFilter.some((key) => String(record[key]).includes(searchQuery)),
	// 	)
	// }, [data, filterByKeys])

	let grouped = useMemo(() => {
		if (!groupByKey) {
			return EMPTY_LIST
		}
		let key = groupByKey
		return Object.entries(groupBy(searched ?? [], (record) => record[key])).map(
			([title, data]) => ({title, data}),
		)
	}, [searched, groupByKey])

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	let listEmpty = searchQuery ? (
		<NoticeView text={`No results found for "${searchQuery}"`} />
	) : isLoading ? (
		<LoadingView />
	) : (
		<NoticeView text="No results found." />
	)

	let commonProps: VirtualizedListWithoutRenderItemProps<T> = {
		ItemSeparatorComponent: ListSeparator,
		ListEmptyComponent: listEmpty,
		ListHeaderComponent: null, // this is where the FilterToolbar would go!
		contentContainerStyle: styles.contentContainer,
		contentInsetAdjustmentBehavior: 'automatic',
		keyboardDismissMode: 'on-drag',
		keyboardShouldPersistTaps: 'never',
		onRefresh: refetch,
		refreshing: isRefetching,
		style: styles.wrapper,
	}

	if (groupByKey) {
		return (
			<SectionList
				{...commonProps}
				renderItem={renderItem}
				renderSectionHeader={(p) => (
					<ListSectionHeader title={p.section.title} />
				)}
				sections={grouped}
			/>
		)
	} else {
		return <FlatList {...commonProps} data={searched} renderItem={renderItem} />
	}
}
