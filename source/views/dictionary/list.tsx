import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ChangeTextEvent} from '../../navigation/types'
import {useDictionary} from './query'
import type {WordType, DictionaryGroup} from './types'

import {
	Detail,
	largeListProps,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import * as c from '@frogpond/colors'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import words from 'lodash/words'

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(
		new Set([...splitToArray(term.word), ...splitToArray(term.definition)]),
	)
}

function groupWords(words: WordType[]): DictionaryGroup[] {
	let grouped = groupBy(words, (w) => w.word[0] || '?')
	return Object.entries(grouped).map(([k, v]) => ({
		title: k,
		data: v,
	}))
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	rowDetailText: {
		fontSize: 14,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function DictionaryView(): JSX.Element {
	let navigation = useNavigation()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data = [],
		error,
		refetch,
		isLoading,
		isError,
		isRefetching,
	} = useDictionary()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.quaternarySystemFill,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let filtered = React.useMemo(() => {
		let grouped = groupWords(data)
		let filteredData = []
		for (let {title, data: items} of grouped) {
			let filteredItems = items.filter((value) =>
				termToArray(value).some((value) => value.includes(searchQuery)),
			)
			if (filteredItems.length) {
				filteredData.push({title, data: items})
			}
		}
		return filteredData
	}, [data, searchQuery])

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
			keyExtractor={(item, index) => item.word + index}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => {
				return (
					<ListRow
						arrowPosition="top"
						onPress={() => navigation.navigate('DictionaryDetail', {item})}
					>
						<Title lines={1}>{item.word}</Title>
						<Detail lines={2} style={styles.rowDetailText}>
							{item.definition}
						</Detail>
					</ListRow>
				)
			}}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={filtered}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {DictionaryView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Campus Dictionary',
}
