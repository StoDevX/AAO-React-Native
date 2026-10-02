import * as React from 'react'
import {TextField, type TextFieldRef, useNativeState} from '@expo/ui/swift-ui'
import {
	keyboardType as keyboardTypeModifier,
	lineLimit,
	submitLabel,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'

type Props = {
	/** The value the field should be showing, from wherever it is kept. */
	value: string
	placeholder: string
	/** Grows the field vertically rather than scrolling one line. */
	multiline?: boolean
	autocapitalization?: 'never' | 'words' | 'sentences' | 'characters'
	keyboardType?:
		| 'default'
		| 'email-address'
		| 'numeric'
		| 'phone-pad'
		| 'ascii-capable'
		| 'numbers-and-punctuation'
		| 'url'
		| 'name-phone-pad'
		| 'decimal-pad'
		| 'twitter'
		| 'web-search'
		| 'ascii-capable-number-pad'
	onChangeText: (text: string) => void
}

/// How many lines a multiline field shows before it scrolls.
const MULTILINE_LIMIT = 4

/// The field among a form's `SyncedTextField`s that holds focus, if any.
const FocusedFieldContext =
	React.createContext<React.RefObject<React.RefObject<TextFieldRef | null> | null> | null>(null)

/**
 * Lets the fields beneath it report which of them holds focus, so the screen
 * can let go of it with `useBlurFocusedField`.
 */
export function FocusedFieldProvider(props: {children: React.ReactNode}): React.ReactNode {
	let focused = React.useRef<React.RefObject<TextFieldRef | null> | null>(null)
	return (
		<FocusedFieldContext.Provider value={focused}>{props.children}</FocusedFieldContext.Provider>
	)
}

/**
 * Returns a function that takes focus away from whichever field under the
 * nearest `FocusedFieldProvider` holds it, resolving once the field has the
 * request.
 *
 * An alert remembers the focused field and hands focus back to it when
 * dismissed. If that alert's button then removes the field's row from a
 * SwiftUI `List`, the field resigns in the middle of the removal, and
 * UICollectionView aborts because a first responder in a deleted row is still
 * resigning. Letting go before the alert goes up leaves it nothing to restore.
 */
export function useBlurFocusedField(): () => Promise<void> {
	let focused = React.useContext(FocusedFieldContext)
	return async () => {
		await focused?.current?.current?.blur()
	}
}

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
	let {
		value,
		placeholder,
		multiline = false,
		autocapitalization,
		keyboardType,
		onChangeText,
	} = props

	let state = useNativeState(value)
	let lastEmitted = React.useRef(value)

	let field = React.useRef<TextFieldRef>(null)
	let focused = React.useContext(FocusedFieldContext)
	let onFocusChange = (isFocused: boolean) => {
		if (!focused) {
			return
		}
		if (isFocused) {
			focused.current = field
		} else if (focused.current === field) {
			focused.current = null
		}
	}

	// A field removed while focused, its schedule deleted say, must not be
	// left behind as the one to blur.
	React.useEffect(
		() => () => {
			if (focused?.current === field) {
				focused.current = null
			}
		},
		[focused],
	)

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
	if (keyboardType) {
		modifiers.push(keyboardTypeModifier(keyboardType))
	}

	return (
		<TextField
			axis={multiline ? 'vertical' : 'horizontal'}
			modifiers={modifiers}
			onFocusChange={onFocusChange}
			onTextChange={(text) => {
				lastEmitted.current = text
				onChangeText(text)
			}}
			placeholder={placeholder}
			ref={field}
			text={state}
		/>
	)
}
