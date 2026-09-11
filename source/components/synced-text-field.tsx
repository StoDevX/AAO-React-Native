import * as React from 'react'
import {TextField, useNativeState} from '@expo/ui/swift-ui'
import {lineLimit, submitLabel, textInputAutocapitalization} from '@expo/ui/swift-ui/modifiers'

type Props = {
	/** The value the field should be showing, from wherever it is kept. */
	value: string
	placeholder: string
	/** Grows the field vertically rather than scrolling one line. */
	multiline?: boolean
	autocapitalization?: 'never' | 'words' | 'sentences' | 'characters'
	onChangeText: (text: string) => void
}

/// How many lines a multiline field shows before it scrolls.
const MULTILINE_LIMIT = 4

/**
 * A text field whose value lives somewhere else -- a reducer, a store -- and
 * which has to keep up with changes from there without fighting the keyboard.
 *
 * A SwiftUI `TextField` writes through native state rather than a prop, so it
 * cannot simply be re-rendered with a new string the way a React Native one
 * can. Pushing every incoming value into that state would mean pushing back
 * the echo of each keystroke, since the typing is what updated the store in
 * the first place.
 *
 * So the last value this field emitted is remembered, and an incoming value
 * equal to it is left alone. Anything else -- a draft that loaded late, a
 * schedule deleted out from under the field -- is a change from elsewhere and
 * does land.
 */
export function SyncedTextField(props: Props): React.ReactNode {
	let {value, placeholder, multiline = false, autocapitalization, onChangeText} = props

	let state = useNativeState(value)
	let lastEmitted = React.useRef(value)

	React.useEffect(() => {
		if (value !== lastEmitted.current) {
			lastEmitted.current = value
			state.set(value)
		}
		// `state` is stable for the component's lifetime; only an incoming
		// `value` should be able to trigger this.
		// oxlint-disable-next-line react/exhaustive-deps
	}, [value])

	let modifiers = [submitLabel('done')]
	if (multiline) {
		modifiers.push(lineLimit(MULTILINE_LIMIT))
	}
	if (autocapitalization) {
		modifiers.push(textInputAutocapitalization(autocapitalization))
	}

	return (
		<TextField
			axis={multiline ? 'vertical' : 'horizontal'}
			modifiers={modifiers}
			onTextChange={(text) => {
				lastEmitted.current = text
				onChangeText(text)
			}}
			placeholder={placeholder}
			text={state}
		/>
	)
}
