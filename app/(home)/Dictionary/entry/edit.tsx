import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Button, Form, Host, List, Section, Text, TextField, useNativeState} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	environment,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation, useRouter} from 'expo-router'
import {usePreventRemove} from 'expo-router/react-navigation'
import noop from 'lodash/noop'
import {NoticeView} from '@frogpond/notice'

import {DisclosureRow} from '../../../../source/components/rows'
import {
	hasChanges,
	hasDefinition,
	useDictionaryDraftStore,
} from '../../../../source/features/dictionary/store'

const styles = StyleSheet.create({
	host: {flex: 1},
})

export default function DictionaryEditPage(): React.ReactNode {
	let router = useRouter()
	let navigation = useNavigation()
	let store = useDictionaryDraftStore()
	let {draft, submitted} = store

	// The draft outlives this screen's push to a sense or the preview, and is
	// dropped only when the form itself leaves the stack.
	React.useEffect(() => () => useDictionaryDraftStore.getState().clearDraft(), [])

	let changed = hasChanges(store)
	// An entry stripped of every definition is a change, and a report saying
	// only what the word is called. Preview refuses it rather than sending one.
	let defined = hasDefinition(store)
	let previewable = changed && defined

	/**
	 * Blocks any exit that would lose the draft — this screen's own Back, and,
	 * because `usePreventRemove` registers the route with the navigator's
	 * `PreventRemoveProvider`, a drag-down of the sheet itself, including while
	 * a sense screen sits on top.
	 */
	usePreventRemove(changed && !submitted, ({data}) => {
		Alert.alert(
			'Discard changes?',
			'You have made unsaved changes. Are you sure you want to discard them?',
			[
				{text: 'Edit', style: 'cancel', onPress: noop},
				{text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action)},
			],
		)
	})

	let [reordering, setReordering] = React.useState(false)

	// `TextField.text` takes a `useNativeState` handle, not a plain string, and
	// a handle's initial value is captured once on mount -- so these are called
	// unconditionally, ahead of the "no draft" return below, rather than after
	// it where `draft` is known non-null. Nothing else ever writes a headword
	// field once this screen is up, so the one capture stays the field's
	// source of truth for the life of the mount.
	let wordText = useNativeState(draft?.word ?? '')
	let pronunciationText = useNativeState(draft?.pronunciation ?? '')
	let partOfSpeechText = useNativeState(draft?.partOfSpeech ?? '')

	if (!draft) {
		return <NoticeView text="There is nothing to edit — open an entry first." />
	}

	let manySenses = draft.senses.length > 1

	// What the Senses footer says, in the three states the draft can be in: not
	// yet edited, edited into something that cannot be sent, and ready. Each of
	// the first two leaves Preview disabled, so the wording is the only thing
	// telling the two apart.
	let footerText = !changed
		? 'No changes yet'
		: defined
			? 'Ready to preview'
			: 'Add a definition to preview'

	let openNewSense = (): void => {
		let id = store.addSense()
		if (id) {
			router.navigate({pathname: '/Dictionary/entry/sense', params: {senseId: id}})
		}
	}

	return (
		<>
			<Stack.Title>Suggest an Edit</Stack.Title>
			{/* On device, the edge-swipe gesture did not reliably surface the
			    unsaved-changes alert -- turned off here rather than guarded.
			    See Campus/detail/report.tsx. */}
			<Stack.Screen options={{gestureEnabled: false}} />
			<Stack.Toolbar placement="left">
				{/* The default native back button had the same problem on device.
				    Routing Back through an explicit `goBack()` call here lets the
				    guard intercept it -- the guard's own Discard button then
				    dispatches the very action `goBack()` triggered and the guard
				    caught, rather than sharing a dispatch with it up front. */}
				<Stack.Toolbar.Button
					accessibilityLabel="Back"
					icon="chevron.left"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>
			<Stack.Toolbar placement="right">
				{manySenses ? (
					<Stack.Toolbar.Button
						accessibilityLabel="Reorder"
						icon={reordering ? 'checkmark' : 'arrow.up.arrow.down'}
						onPress={() => setReordering((on) => !on)}
					/>
				) : null}
				{/* In the toolbar rather than a footer: at the sheet's resting
				    detent a footer sinks below the fold once an entry has more than
				    a sense or two. */}
				<Stack.Toolbar.Button
					accessibilityLabel="Preview"
					disabled={!previewable}
					icon="eye"
					onPress={() => router.navigate('/Dictionary/entry/preview')}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<Form
					modifiers={[
						accessibilityIdentifier('dictionary-edit-form'),
						// SwiftUI's reorder machinery reads `editMode` from the
						// `List`/`Form` itself, not from a `Section` inside it.
						environment({key: 'editMode', value: reordering ? 'active' : 'inactive'}),
					]}
				>
					<Section title="Word">
						<TextField
							modifiers={[accessibilityLabel('Word'), textInputAutocapitalization('words')]}
							onTextChange={store.setWord}
							placeholder="Word"
							text={wordText}
						/>
						<TextField
							modifiers={[accessibilityLabel('Pronunciation')]}
							onTextChange={store.setPronunciation}
							placeholder="Pronunciation"
							text={pronunciationText}
						/>
						<TextField
							modifiers={[accessibilityLabel('Part of Speech')]}
							onTextChange={store.setPartOfSpeech}
							placeholder="Part of Speech"
							text={partOfSpeechText}
						/>
					</Section>

					{/* The footer says whether there is a suggestion to preview yet, and
					    stays mounted to say it: swapping a footer in and out on the first
					    edit rebuilds this Section natively, and keystrokes already in
					    flight are dropped when it does -- typing "indeed " into a
					    definition arrived as "ind". Every state carries wording for the
					    same reason: an empty footer is still a view, of a height nobody
					    has looked at. */}
					<Section footer={<Text>{footerText}</Text>} title="Senses">
						<List.ForEach
							onDelete={(indices) =>
								indices.forEach((index) => store.deleteSense(draft.senses[index].id))
							}
							// `from` can only ever hold one index here: this `List` sets no
							// `selection`, so nothing lets a reader multi-select senses
							// before dragging, and a single-row drag is the only gesture
							// SwiftUI's `onMove` offers without it.
							onMove={(from, to) => store.moveSense(null, from[0], to)}
						>
							{draft.senses.map((sense, index) => (
								// The definition is the row's own label: no `detail` means
								// `rowLabel` renders it bare, which is what a reorder test
								// reads to find where a drag left a sense. The identifier is
								// how a test addresses the row instead.
								<DisclosureRow
									key={sense.id}
									identifier={`dictionary-sense-row-${index + 1}`}
									onPress={() =>
										router.navigate({
											pathname: '/Dictionary/entry/sense',
											params: {senseId: sense.id},
										})
									}
									title={sense.definition || `Sense ${index + 1}`}
									titleLines={2}
								/>
							))}
						</List.ForEach>

						{/* Adding a sense and opening it are one action: the row it
						    appends has nowhere to type a definition. */}
						<Button label="Add Sense" onPress={openNewSense} systemImage="plus" />
					</Section>
				</Form>
			</Host>
		</>
	)
}
