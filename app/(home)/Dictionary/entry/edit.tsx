import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Button, Form, Host, List, Section, Text, TextField, useNativeState} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	environment,
	lineLimit,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation, useRouter} from 'expo-router'
import {usePreventRemove} from 'expo-router/react-navigation'
import noop from 'lodash/noop'
import {NoticeView} from '@frogpond/notice'

import type {DraftSense} from '../../../../source/features/dictionary/lib/draft'
import {hasChanges, useDictionaryDraftStore} from '../../../../source/features/dictionary/store'

/// How many lines of a definition stay on screen before the field scrolls.
const DEFINITION_LINES = {min: 2, max: 10}

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
	// oxlint-disable-next-line react/exhaustive-deps
	React.useEffect(() => () => store.clearDraft(), [])

	let changed = hasChanges(store)

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

	return (
		<>
			<Stack.Title>Suggest an Edit</Stack.Title>
			{/* The native back button did not reliably surface the guard's alert
			    on device, so Back is driven through the same dispatch the guard's
			    own Discard button uses. See Campus/detail/report.tsx. */}
			<Stack.Screen options={{gestureEnabled: false}} />
			<Stack.Toolbar placement="left">
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
					disabled={!changed}
					icon="eye"
					onPress={() => router.push('/Dictionary/entry/preview')}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<Form modifiers={[accessibilityIdentifier('dictionary-edit-form')]}>
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

					{/* Every row is the sense's own definition. Under an active edit
					    mode SwiftUI makes row content inert, so the fields stop taking
					    taps while the reorder handles are up -- which is why the
					    toolbar toggles between the two rather than showing both. */}
					<Section
						footer={changed ? undefined : <Text>No changes yet</Text>}
						modifiers={reordering ? [environment({key: 'editMode', value: 'active'})] : []}
						title="Senses"
					>
						<List.ForEach
							onDelete={(indices) =>
								indices.forEach((index) => store.deleteSense(draft.senses[index].id))
							}
							onMove={(from, to) => store.moveSense(null, from[0], to)}
						>
							{draft.senses.map((sense, index) => (
								<SenseDefinitionField
									key={sense.id}
									index={index}
									onChange={(definition) => store.setSenseField(sense.id, {definition})}
									sense={sense}
								/>
							))}
						</List.ForEach>

						{draft.senses.map((sense, index) => (
							<Button
								key={`options-${sense.id}`}
								label={`Sense ${index + 1} Options`}
								onPress={() =>
									router.push({
										pathname: '/Dictionary/entry/sense',
										params: {senseId: sense.id},
									})
								}
								systemImage="chevron.right"
							/>
						))}

						<Button label="Add Sense" onPress={store.addSense} systemImage="plus" />
					</Section>
				</Form>
			</Host>
		</>
	)
}

type SenseDefinitionFieldProps = {
	sense: DraftSense
	index: number
	onChange: (definition: string) => void
}

/**
 * One sense's definition row.
 *
 * Its own component rather than a `TextField` written straight into the
 * `map` below: a `useNativeState` handle's initial value is captured once on
 * mount, so it needs a hook call whose count does not change as senses are
 * added, deleted or reordered. A component keyed by the sense's id gives each
 * row a stable hook of its own; called inline in the loop, adding or removing
 * a sense would change how many times `useNativeState` ran on this render
 * and break React's rule that a component call the same hooks every time.
 */
function SenseDefinitionField({
	sense,
	index,
	onChange,
}: SenseDefinitionFieldProps): React.ReactNode {
	let text = useNativeState(sense.definition)
	return (
		<TextField
			axis="vertical"
			modifiers={[
				accessibilityLabel(`Definition ${index + 1}`),
				lineLimit(DEFINITION_LINES),
				textInputAutocapitalization('sentences'),
			]}
			onTextChange={onChange}
			placeholder="Definition"
			text={text}
		/>
	)
}
