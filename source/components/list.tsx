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
import React, {useMemo} from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ChangeTextEvent} from '../navigation/types'

type FlatData<T> = ({key: string} & T)[]
type SectionData<T> = {title: string; data: FlatData<T>}[]

type Props<T extends {key: string}, E> = {
	query: UseQueryResult<SectionData<T>, E>
	search?: ReadonlyArray<keyof T>
	group?: ReadonlyArray<keyof T>
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

export function List<T extends {key: string}, E extends Error>(
	props: Props<T, E>,
): JSX.Element {
	let {
		query,
		search = EMPTY_LIST,
		filter = EMPTY_LIST,
		group = EMPTY_LIST,
		renderItem,
	} = props

	let navigation = useNavigation()
	let [searchQuery, setSearchQuery] = React.useState('')

	let {data, error, refetch, isLoading, isError, isRefetching} = query

	let filtered = useMemo(
		() =>
			data
				?.map((group) => ({
					...group,
					data: group.data.filter((record) =>
						search.some((key) => String(record[key]).includes(searchQuery)),
					),
				}))
				.filter((group) => group.data.length) ?? [],
		[data, searchQuery, search],
	)

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

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				searchQuery ? (
					<NoticeView text={`No results found for "${searchQuery}"`} />
				) : isLoading ? (
					<LoadingView />
				) : (
					<NoticeView text="No results found." />
				)
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={renderItem}
			renderSectionHeader={(p) => <ListSectionHeader title={p.section.title} />}
			sections={filtered}
			style={styles.wrapper}
		/>
	)
}
