import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'
import * as c from '@frogpond/colors'
import {useQuery} from '@tanstack/react-query'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {EntryDefinition} from '../../../source/features/dictionary/entry-definition'
import {normalizeEntry} from '../../../source/features/dictionary/lib/entry'
import {wordByTermOptions} from '../../../source/features/dictionary/query'
import {useCampus} from '../../../source/features/campus/store'
import {useDictionaryDraftStore} from '../../../source/features/dictionary/store'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function DictionaryEntryPage(): React.ReactNode {
	let router = useRouter()
	let {word} = useLocalSearchParams<{word: string}>()
	let campus = useCampus()
	let {data: raw, isLoading} = useQuery(wordByTermOptions(word, campus))

	// Hoisted rather than normalised again down at `EntryDefinition`'s own
	// prop: `startDraft` below needs the exact entry the reader is looking
	// at, so that is true by construction, not by two separate calls to
	// `normalizeEntry` happening to agree.
	let entry = raw ? normalizeEntry(raw) : undefined

	let suggestAnEdit = React.useCallback(() => {
		// The toolbar button renders through the loading and not-found branches
		// too, so this can fire before there is an entry to start a draft from.
		if (!entry) {
			return
		}

		// The store's `original` has to be the entry the reader actually opened
		// -- not whatever a query refetch turns up later -- so the draft starts
		// here, before the push, rather than in the edit screen itself. Seeding
		// it any later would also arrive too late for the edit screen's own
		// `useNativeState` handles, which capture their initial value on their
		// first render.
		useDictionaryDraftStore.getState().startDraft(entry)
		router.navigate('/dictionary/entry/edit')
	}, [entry, router])

	let screen = (
		<>
			<Stack.Title>Dictionary</Stack.Title>
			<SheetCloseButton />
			{/* Suggestions are filed against St. Olaf's dictionary data, so Carleton's offers none. */}
			{campus === 'stolaf' ? (
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Button
						accessibilityLabel="Suggest an Edit"
						icon="exclamationmark.bubble"
						onPress={suggestAnEdit}
					/>
				</Stack.Toolbar>
			) : null}
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

	if (!entry) {
		return (
			<>
				{screen}
				<NoticeView
					description={`Nothing in the dictionary is called “${word}”.`}
					systemImage="character.book.closed"
					title="Entry Not Found"
				/>
			</>
		)
	}

	return (
		<>
			{screen}
			<Host style={styles.host}>
				<EntryDefinition entry={entry} />
			</Host>
		</>
	)
}
