import * as React from 'react'
import {StyleSheet, RefreshControl, SectionList} from 'react-native'
import {
	Detail,
	Title,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	largeListProps,
} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import type {WordType} from './types'
import {white} from '@frogpond/colors'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import {useAsync} from 'react-async'
import type {AsyncState} from 'react-async'
import {useDebounce} from '@frogpond/use-debounce'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {ChangeTextEvent} from '../../navigation/types'

const fetchDictionaryTerms = (args: {
	signal: window.AbortController
}): Promise<Array<WordType>> => {
	return fetch(API('/dictionary'), {signal: args.signal})
		.json<{data: Array<WordType>}>()
		.then((body) => body.data)
}

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function termToArray(term: WordType) {
	return Array.from(
		new Set([...splitToArray(term.word), ...splitToArray(term.definition)]),
	)
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
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let navigation = useNavigation()

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: white,
				onChangeText: (event: ChangeTextEvent) =>
					setQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	let {data, error, reload, isPending}: AsyncState<Array<WordType>> =
		useAsync(fetchDictionaryTerms)

	let results = React.useMemo(() => {
		let allTerms = data || []

		if (!searchQuery) {
			return allTerms
		}

		return allTerms.filter((term) =>
			termToArray(term).some((word) => word.startsWith(searchQuery)),
		)
	}, [data, searchQuery])

	let grouped = React.useMemo(() => {
		return toPairs(groupBy(results, (item) => item.word[0])).map(([k, v]) => {
			return {title: k, data: v}
		})
	}, [results])

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
				<NoticeView text={`No results found for "${query}"`} />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: WordType, index) => item.word + index}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="never"
			refreshControl={
				<RefreshControl onRefresh={reload} refreshing={isPending} />
			}
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
	headerBackTitle: 'Back',
}
