import * as React from 'react'
import {requireNativeView} from 'expo'

export type SelectableTextProps = {
	text: string
	testID?: string
}

const SelectableTextNativeView: React.ComponentType<SelectableTextProps> = requireNativeView(
	'SelectableText',
	'SelectableTextView',
)

/// A block of body text a reader can select, and whose phone numbers,
/// addresses, links and dates iOS turns into things they can tap. Renders only
/// inside a `Host`: it is a SwiftUI view, not a React Native one.
export function SelectableText(props: SelectableTextProps): React.ReactNode {
	return <SelectableTextNativeView {...props} />
}
