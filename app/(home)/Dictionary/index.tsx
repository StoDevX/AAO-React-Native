import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BottomSheet, Group, Host} from '@expo/ui/swift-ui'
import {
	background,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'

import {SearchBar} from '../../../source/components/search-bar'
import {EntryDefinition} from '../../../source/features/dictionary/entry-definition'
import {EntryList} from '../../../source/features/dictionary/entry-list'
import {
	filterEntries,
	groupEntries,
	normalizeEntry,
} from '../../../source/features/dictionary/lib/entry'
import {dictionaryOptions} from '../../../source/features/dictionary/query'
import type {NormalizedEntry} from '../../../source/features/dictionary/types'

const SHEET_DETENTS: PresentationDetent[] = ['medium', 'large']

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	sheetHost: {
		...StyleSheet.absoluteFill,
	},
})

function DictionaryView(): React.ReactNode {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data = [], refetch, isLoading, isError} = useQuery(dictionaryOptions)

	let groups = React.useMemo(
		() => groupEntries(filterEntries(data.map(normalizeEntry), searchQuery)),
		[data, searchQuery],
	)

	let [selected, setSelected] = React.useState<NormalizedEntry | null>(null)
	let [detent, setDetent] = React.useState<PresentationDetent>('medium')

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
					onSelect={setSelected}
					query={searchQuery}
				/>
			</Host>

			{/* Covers the list and lets every touch through. The sheet is
			    presented rather than laid out, so a zero-sized Host would do --
			    except that a zero-sized Host gives any hosted content no bounds
			    to draw into. Full-bleed with `pointerEvents="none"` satisfies
			    both; the sheet is presented in its own window, so it stays
			    interactive. See app/(home)/Map/index.tsx. */}
			<Host pointerEvents="none" style={styles.sheetHost}>
				<BottomSheet
					isPresented={selected !== null}
					onIsPresentedChange={(presented) => {
						if (!presented) {
							setSelected(null)
							setDetent('medium')
						}
					}}
				>
					<Group
						modifiers={[
							background(c.systemGroupedBackground),
							presentationDetents(SHEET_DETENTS, {
								selection: detent,
								onSelectionChange: setDetent,
							}),
							presentationDragIndicator('visible'),
						]}
					>
						{selected ? (
							<EntryDefinition
								entry={selected}
								onClose={() => setSelected(null)}
								onEdit={() => undefined}
							/>
						) : null}
					</Group>
				</BottomSheet>
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
