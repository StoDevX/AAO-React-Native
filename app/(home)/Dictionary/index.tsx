import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {useQuery} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'

import {SearchBar} from '../../../source/components/search-bar'
import {EntryList} from '../../../source/features/dictionary/entry-list'
import {
	filterEntries,
	groupEntries,
	normalizeEntry,
} from '../../../source/features/dictionary/lib/entry'
import {dictionaryOptions} from '../../../source/features/dictionary/query'
import type {NormalizedEntry} from '../../../source/features/dictionary/types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

function DictionaryView(): React.ReactNode {
	let router = useRouter()
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data = [], refetch, isLoading, isError} = useQuery(dictionaryOptions)

	let groups = React.useMemo(
		() => groupEntries(filterEntries(data.map(normalizeEntry), searchQuery)),
		[data, searchQuery],
	)

	let openEntry = React.useCallback(
		(entry: NormalizedEntry) => {
			router.push({pathname: '/Dictionary/entry/[word]', params: {word: entry.word}})
		},
		[router],
	)

	return (
		<>
			{/* The search chrome is bound to component state (the change handler
			    updates query), so it can't move to a static outer component. */}
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />

			<Host style={styles.host}>
				<EntryList
					groups={groups}
					isError={isError}
					isLoading={isLoading}
					onRetry={refetch}
					onSelect={openEntry}
					query={searchQuery}
				/>
			</Host>
		</>
	)
}

export default function DictionaryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Dictionary</Stack.Title>
			<DictionaryView />
		</>
	)
}
