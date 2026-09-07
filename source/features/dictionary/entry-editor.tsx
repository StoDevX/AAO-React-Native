import * as React from 'react'
import {Button, Form, Section, Text, TextField, useNativeState} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	lineLimit,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'

import {submitReport} from './report/submit'
import type {NormalizedEntry} from './types'

/// How many lines of the definition field stay on screen before it scrolls.
const DEFINITION_LINES = {min: 4, max: 20}

type Props = {
	entry: NormalizedEntry
	onDone: () => void
}

/**
 * The form for suggesting a correction to an entry.
 *
 * A multi-sense entry is flattened into one block of prose here: this files a
 * report for a maintainer to read, not a data write, so losing the sense
 * boundaries costs nothing a person cannot restore.
 */
export function EntryEditor({entry, onDone}: Props): React.ReactNode {
	let joined = entry.senses.map((sense) => sense.definition).join('\n\n')

	let [word, setWord] = React.useState(entry.word)
	let [definition, setDefinition] = React.useState(joined)
	let wordState = useNativeState(entry.word)
	let definitionState = useNativeState(joined)

	let submit = () => {
		submitReport(
			{word: entry.word, senses: entry.senses},
			{word: word.trim(), definition: definition.trim()},
		)
		onDone()
	}

	return (
		<Form>
			<Section title="Word">
				<TextField
					modifiers={[accessibilityLabel('Word'), textInputAutocapitalization('words')]}
					onTextChange={setWord}
					placeholder="Word"
					text={wordState}
				/>
			</Section>

			<Section title="Definition">
				<TextField
					axis="vertical"
					modifiers={[
						accessibilityLabel('Definition'),
						lineLimit(DEFINITION_LINES),
						textInputAutocapitalization('sentences'),
					]}
					onTextChange={setDefinition}
					placeholder="Definition"
					text={definitionState}
				/>
			</Section>

			<Section footer={<Text>Thanks for spotting a problem — we’ll take it from here.</Text>}>
				<Button label="Submit Report" onPress={submit} />
			</Section>
		</Form>
	)
}
