import * as React from 'react'
import {Text, View} from 'react-native'
import type {SelectableTextProps} from '@frogpond/selectable-text'

/**
 * `@frogpond/selectable-text` draws a UITextView, and importing it reaches
 * expo-modules-core's native bindings, which Jest does not have. This stand-in
 * keeps every prop on a `View` a test can read back, and writes each paragraph,
 * or the plain `text`, as a `Text` a query can find. It draws nothing of how
 * the text looks: Jest cannot see that.
 */
export function SelectableText(props: SelectableTextProps): React.ReactNode {
	let {paragraphs = [], text = ''} = props
	let lines =
		paragraphs.length > 0 ? paragraphs.map((p) => p.runs.map((run) => run.text).join('')) : [text]
	return (
		<View {...props}>
			{lines.map((line, index) => (
				// oxlint-disable-next-line react/no-array-index-key -- a paragraph's place is its identity
				<Text key={index}>{line}</Text>
			))}
		</View>
	)
}
