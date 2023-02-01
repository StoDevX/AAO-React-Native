import React, {useMemo} from 'react'

import * as c from '@frogpond/colors'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {
	FlatList,
	SectionList,
	StyleSheet,
	VirtualizedListWithoutRenderItemProps,
} from 'react-native'
import {ChangeTextEvent} from '../navigation/types'

type FlatData<T> = ({key: string} & T)[]

type Props<T extends {key: string}, E> = {
	query: UseQueryResult<FlatData<T>, E>
	search?: ReadonlyArray<keyof T>
	groupBy?: keyof T
	filter?: ReadonlyArray<keyof T>
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

/**
 * List will return either a FlatList or a SectionList, depending on
 */
export function List<T extends {key: string}, E extends Error>(
	props: Props<T, E>,
): JSX.Element {
	let {
		query,
		search = EMPTY_LIST,
		filter = EMPTY_LIST,
		groupBy: groupByKey,
		renderItem,
	} = props

	let navigation = useNavigation()
	let [searchQuery, setSearchQuery] = React.useState('')

	let {data, error, refetch, isLoading, isError, isRefetching} = query

	let searched = useMemo(() => {
		if (!data) {
			return EMPTY_LIST
		}
		if (!searchQuery) {
			return data
		}
		return data?.filter((record) =>
			search.some((key) => String(record[key]).includes(searchQuery)),
		)
	}, [data, searchQuery, search])

	let grouped = useMemo(() => {
		if (!groupByKey) {
			return EMPTY_LIST
		}
		let key = groupByKey
		return Object.entries(groupBy(searched ?? [], (record) => record[key])).map(
			([title, data]) => ({title, data}),
		)
	}, [searched, groupByKey])

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setSearchQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

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
