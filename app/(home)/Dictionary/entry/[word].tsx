import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import {useQuery} from '@tanstack/react-query'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {EntryDefinition} from '../../../../source/features/dictionary/entry-definition'
import {normalizeEntry} from '../../../../source/features/dictionary/lib/entry'
import {wordByTermOptions} from '../../../../source/features/dictionary/query'

const styles = StyleSheet.create({
	host: {flex: 1},
})

export default function DictionaryEntryPage(): React.ReactNode {
	let router = useRouter()
	let {word} = useLocalSearchParams<{word: string}>()
	let {data: raw, isLoading} = useQuery(wordByTermOptions(word))

	let suggestAnEdit = React.useCallback(() => {
		router.push({pathname: '/Dictionary/entry/edit', params: {word}})
	}, [router, word])

	let screen = (
		<>
			<Stack.Title>Dictionary</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu accessibilityLabel="More actions" icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction icon="pencil" onPress={suggestAnEdit}>
						Suggest an Edit
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
		</>
	)

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (!raw) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find an entry for “${word}”.`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<Host style={styles.host}>
				<EntryDefinition entry={normalizeEntry(raw)} />
			</Host>
		</>
	)
}
