import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, Host, List, Section, TextField, useNativeState} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	lineLimit,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {NoticeView} from '@frogpond/notice'

import {DEFINITION_LINES} from '../../../../source/features/dictionary/constants'
import type {DraftExample} from '../../../../source/features/dictionary/lib/draft'
import {findSense} from '../../../../source/features/dictionary/lib/draft'
import {useDictionaryDraftStore} from '../../../../source/features/dictionary/store'
import {useDismissOnce} from '../../../../source/lib/use-dismiss-once'

const styles = StyleSheet.create({
	host: {flex: 1},
})

export default function DictionarySensePage(): React.ReactNode {
	let router = useRouter()
	let dismiss = useDismissOnce()
	let {senseId} = useLocalSearchParams<{senseId: string}>()
	let store = useDictionaryDraftStore()

	let sense = store.draft ? findSense(store.draft, senseId) : undefined

	// `TextField.text` takes a `useNativeState` handle, whose initial value is
	// captured once on mount, so both calls happen unconditionally ahead of
	// the "sense is gone" return below -- the sense this screen names can
	// itself trigger that return by being deleted out from under it (the
	// Delete Sense button does exactly that), so the same mount can go from a
	// sense in hand to none, and every hook has to run either way.
	let definitionText = useNativeState(sense?.definition ?? '')
	let grammarText = useNativeState(sense?.grammar ?? '')

	if (!sense) {
		return <NoticeView text="That sense is no longer part of this entry." />
	}

	return (
		<>
			<Stack.Title>Sense</Stack.Title>
			<Host style={styles.host}>
				<Form modifiers={[accessibilityIdentifier('dictionary-sense-form')]}>
					<Section title="Definition">
						<TextField
							axis="vertical"
							modifiers={[
								accessibilityLabel('Definition'),
								lineLimit(DEFINITION_LINES),
								textInputAutocapitalization('sentences'),
							]}
							onTextChange={(definition) => store.setSenseField(sense.id, {definition})}
							placeholder="Definition"
							text={definitionText}
						/>
					</Section>

					{/* How the word is used here -- "with object", "no object" -- the
					    label a dictionary sets in brackets ahead of the definition. */}
					<Section title="Grammar">
						<TextField
							modifiers={[accessibilityLabel('Grammar')]}
							onTextChange={(grammar) => store.setSenseField(sense.id, {grammar})}
							placeholder="with object"
							text={grammarText}
						/>
					</Section>

					<Section title="Examples">
						<List.ForEach
							onDelete={(indices) =>
								indices.forEach((index) => store.deleteExample(sense.id, sense.examples[index].id))
							}
							// `from` can only ever hold one index here: this `List` sets no
							// `selection`, so nothing lets a reader multi-select examples
							// before dragging, and a single-row drag is the only gesture
							// SwiftUI's `onMove` offers without it.
							onMove={(from, to) => store.moveExample(sense.id, from[0], to)}
						>
							{sense.examples.map((example, index) => (
								<ExampleField
									key={example.id}
									example={example}
									index={index}
									onChange={(text) => store.setExampleText(sense.id, example.id, text)}
								/>
							))}
						</List.ForEach>
						<Button
							label="Add Example"
							onPress={() => store.addExample(sense.id)}
							systemImage="plus"
						/>
					</Section>

					{/* The same screen edits a sense at any depth, so a sub-sense is a
					    push back into this route with its own id. */}
					<Section title="Sub-senses">
						{sense.subsenses.map((subsense, index) => (
							<Button
								key={subsense.id}
								label={subsense.definition || `Sub-sense ${index + 1}`}
								onPress={() =>
									router.push({
										pathname: '/Dictionary/entry/sense',
										params: {senseId: subsense.id},
									})
								}
								systemImage="chevron.right"
							/>
						))}
						<Button
							label="Add Sub-sense"
							onPress={() => store.addSubsense(sense.id)}
							systemImage="plus"
						/>
					</Section>

					<Section>
						<Button
							label="Delete Sense"
							onPress={() => {
								store.deleteSense(sense.id)
								dismiss()
							}}
							role="destructive"
							systemImage="trash"
						/>
					</Section>
				</Form>
			</Host>
		</>
	)
}

type ExampleFieldProps = {
	example: DraftExample
	index: number
	onChange: (text: string) => void
}

/**
 * One example citation's row.
 *
 * Its own component for the same reason `SenseDefinitionField` in `edit.tsx`
 * is: a `useNativeState` handle's initial value is captured once on mount, so
 * it needs a hook call whose count does not track how many examples the
 * sense currently has. A component keyed by the example's id gives each row
 * a hook of its own that adding, deleting or reordering examples cannot
 * change the count of.
 *
 * Unlike that sibling, this one does not also need a sync effect pulling its
 * handle back into line with the store: a definition is edited from two
 * screens at once (this one and `edit.tsx`, mounted underneath it), but no
 * second screen ever writes a given example's text -- only this field's own
 * `onChange` does -- so the handle and the store can never disagree while
 * this component is mounted.
 */
function ExampleField({example, index, onChange}: ExampleFieldProps): React.ReactNode {
	let text = useNativeState(example.text)
	return (
		<TextField
			modifiers={[
				accessibilityLabel(`Example ${index + 1}`),
				textInputAutocapitalization('sentences'),
			]}
			onTextChange={onChange}
			placeholder="Example"
			text={text}
		/>
	)
}
