import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {DictionaryEditorView} from '../../../../source/views/dictionary'
import {wordByTermOptions} from '../../../../source/views/dictionary/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DictionaryEditorPage(): React.ReactNode {
	let {word} = useLocalSearchParams<{word: string}>()
	let {
		data: entry,
		isLoading,
		error,
		refetch,
	} = useQuery(wordByTermOptions(word))

	let screen = <Stack.Screen options={{title: 'Suggest an edit'}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!entry) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the word "${word}".`} />
			</>
		)
	}

	return (
		<>
			{screen}
			<DictionaryEditorView word={entry} />
		</>
	)
}
