import * as React from 'react'
import {StyleSheet, useColorScheme} from 'react-native'
import {BottomSheet, Group, Host} from '@expo/ui/swift-ui'
import {
	presentationBackground,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {Stack} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'

import {SearchBar} from '../../../source/components/search-bar'
import {EntryDefinition} from '../../../source/features/dictionary/entry-definition'
import {EntryEditor} from '../../../source/features/dictionary/entry-editor'
import {EntryList} from '../../../source/features/dictionary/entry-list'
import {
	filterEntries,
	groupEntries,
	normalizeEntry,
} from '../../../source/features/dictionary/lib/entry'
import {dictionaryOptions} from '../../../source/features/dictionary/query'
import type {NormalizedEntry} from '../../../source/features/dictionary/types'

const SHEET_DETENTS: PresentationDetent[] = ['medium', 'large']
/// `systemGroupedBackground`, resolved: the sheet's own chrome takes a hex
/// rather than a PlatformColor.
const LIGHT_SHEET_BACKGROUND = '#F2F2F7'
const DARK_SHEET_BACKGROUND = '#000000'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	sheetHost: {
		...StyleSheet.absoluteFill,
	},
})

function DictionaryView(): React.ReactNode {
	let scheme = useColorScheme()
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {data = [], refetch, isLoading, isError} = useQuery(dictionaryOptions)

	let groups = React.useMemo(
		() => groupEntries(filterEntries(data.map(normalizeEntry), searchQuery)),
		[data, searchQuery],
	)

	let [selected, setSelected] = React.useState<NormalizedEntry | null>(null)
	let [detent, setDetent] = React.useState<PresentationDetent>('medium')
	let [editing, setEditing] = React.useState(false)

	/**
	 * Puts the sheet back to its rest state: no entry selected, detent back
	 * to medium. Both ways of leaving the sheet -- the native drag-to-dismiss
	 * gesture and `EntryDefinition`'s close button -- must call this same
	 * function rather than resetting state inline.
	 *
	 * That's because `BottomSheet`'s `onIsPresentedChange` only fires when
	 * the *native* side changes `isPresented` out from under the JS prop (a
	 * drag); its `.onChange(of: isPresented)` guard in
	 * `@expo/ui`'s `ios/BottomSheetView.swift` compares the incoming value
	 * against the current prop and swallows the callback once they already
	 * agree. A JS-initiated close sets `isPresented` to `false` itself, so by
	 * the time that `onChange` fires, both sides already agree and the
	 * callback never runs. `onClose` is therefore the only place a
	 * JS-initiated close can reset state, and it has to reset the same
	 * things `onIsPresentedChange` does.
	 */
	let dismissSheet = React.useCallback(() => {
		setSelected(null)
		setDetent('medium')
		setEditing(false)
	}, [])

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
							dismissSheet()
						}
					}}
				>
					<Group
						modifiers={[
							// The sheet's own chrome is a translucent material, so the
							// list reads through anywhere the entry does not cover. A
							// PlatformColor rather than the hex `presentationBackground`
							// wants, so the sheet still follows the system appearance --
							// and carried under the home indicator, which the content's
							// own safe-area inset would otherwise leave bare.
							// `background()` stops at the safe-area inset, leaving the
							// sheet's translucent chrome showing as a grey band over the
							// home indicator. `presentationBackground` paints the chrome
							// itself, and is the only modifier that reaches it -- but it
							// takes a hex rather than a PlatformColor, so the scheme has
							// to be resolved here to keep the sheet following the system
							// appearance.
							presentationBackground(
								scheme === 'dark' ? DARK_SHEET_BACKGROUND : LIGHT_SHEET_BACKGROUND,
							),
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
								onClose={dismissSheet}
								onEdit={() => setEditing(true)}
							/>
						) : null}

						{/* Mounted whenever an entry is selected, with `isPresented`
						    doing the work. Rendering it away conditionally is how
						    nested SwiftUI sheets stop presenting. */}
						<BottomSheet isPresented={editing} onIsPresentedChange={setEditing}>
							<Group modifiers={[presentationDetents(['large'])]}>
								{/* Keyed on the word: `useNativeState` captures its initial
								    value on first render only, so without a remount the
								    fields would still hold the previously-opened entry. */}
								{selected ? (
									<EntryEditor
										entry={selected}
										key={selected.word}
										onDone={() => setEditing(false)}
									/>
								) : null}
							</Group>
						</BottomSheet>
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
