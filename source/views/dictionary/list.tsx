import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	largeListProps,
	emptyList,
} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import type {DictionaryGroup, WordType} from './types'
import {white} from '@frogpond/colors'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import {useFetch} from 'react-async'
import {API} from '@frogpond/api'
import {useDebounce} from '@frogpond/use-debounce'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {ChangeTextEvent} from '../../navigation/types'

const useDictionary = () => {
	return useFetch<{data: WordType[]}>(API('/dictionary'), {
		headers: {accept: 'application/json'},
	})
}

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(
		new Set([...splitToArray(term.word), ...splitToArray(term.definition)]),
	)
}

function createGrouping(words: WordType[]) {
	let grouped = groupBy(words, (w) => w.word[0] || '?')
	return Object.entries(grouped).map(([k, v]) => ({
		title: k,
		data: v,
	}))
}

let groupTerms = (
	searchQuery: string,
	data: DictionaryGroup[],
	words: WordType[],
) => {
	if (!data) {
		return emptyList
	}

	if (!searchQuery) {
		return data
	}

	let filtered = words.filter((term: WordType) =>
		termToArray(term).some((word) => word.startsWith(searchQuery)),
	)

	return createGrouping(filtered)
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
		data: {data: words = []} = {},
		error,
		reload,
		isPending,
		isInitial,
		isLoading,
	} = useDictionary()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: white,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let groupedOriginal = React.useMemo(() => {
		return createGrouping(words)
	}, [words])

	let grouped = React.useMemo(
		() => groupTerms(searchQuery, groupedOriginal, words),
		[searchQuery, groupedOriginal, words],
	)

	// conditionals must come after all hooks
	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={reload}
				text="A problem occured while loading the definitions"
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
			keyExtractor={(item: WordType, index) => item.word + index}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			onRefresh={reload}
			refreshing={isPending && !isInitial}
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
			sections={grouped}
			style={styles.wrapper}
			{...largeListProps}
		/>
	)
}

export {DictionaryView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Campus Dictionary',
}
