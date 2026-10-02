import * as React from 'react'
import type {TextFieldRef} from '@expo/ui/swift-ui'

type FieldRef = React.RefObject<TextFieldRef | null>

type FocusRegistry = {
	/** Records the field as the one holding focus. */
	focus: (field: FieldRef) => void
	/** Forgets the field, if it was the one holding focus. */
	unfocus: (field: FieldRef) => void
	/** Takes focus away from the field holding it, if any. */
	blur: () => Promise<void>
}

const FocusRegistryContext = React.createContext<FocusRegistry | null>(null)

/**
 * Lets the fields beneath it report which of them holds focus, so the screen
 * can let go of it with `useBlurFocusedField`.
 */
export function FocusedFieldProvider(props: {children: React.ReactNode}): React.ReactNode {
	let focused = React.useRef<FieldRef | null>(null)
	let [registry] = React.useState<FocusRegistry>(() => ({
		focus: (field) => {
			focused.current = field
		},
		unfocus: (field) => {
			if (focused.current === field) {
				focused.current = null
			}
		},
		blur: async () => {
			await focused.current?.current?.blur()
		},
	}))
	return (
		<FocusRegistryContext.Provider value={registry}>{props.children}</FocusRegistryContext.Provider>
	)
}

/**
 * The `ref` and `onFocusChange` to spread onto a SwiftUI `TextField` so the
 * nearest `FocusedFieldProvider` knows when it holds focus. Outside a provider
 * they do nothing.
 */
export function useTrackedField(): {
	ref: FieldRef
	onFocusChange: (isFocused: boolean) => void
} {
	let ref = React.useRef<TextFieldRef>(null)
	let registry = React.useContext(FocusRegistryContext)

	// A field removed while focused, its row deleted say, must not be left
	// behind as the one to blur.
	React.useEffect(() => () => registry?.unfocus(ref), [registry])

	let onFocusChange = (isFocused: boolean) => {
		if (isFocused) {
			registry?.focus(ref)
		} else {
			registry?.unfocus(ref)
		}
	}

	return {ref, onFocusChange}
}

/**
 * Returns a function that takes focus away from whichever field under the
 * nearest `FocusedFieldProvider` holds it, resolving once the field has the
 * request.
 *
 * An alert remembers the focused field and hands focus back to it when
 * dismissed. If that alert's button then removes the field's row from a
 * SwiftUI `List` or `Form`, the field resigns in the middle of the removal,
 * and UICollectionView aborts because a first responder in a deleted row is
 * still resigning. Letting go before the alert goes up leaves it nothing to
 * restore.
 */
export function useBlurFocusedField(): () => Promise<void> {
	let registry = React.useContext(FocusRegistryContext)
	return async () => {
		await registry?.blur()
	}
}
