import * as React from 'react'
import {requireNativeView} from 'expo'

type NativeProps = {text: string}

const HyphenatedTextNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'HyphenatedText',
	'HyphenatedTextView',
)

/** A paragraph that hyphenates, for use inside an @expo/ui SwiftUI tree. */
export function HyphenatedText({text}: {text: string}): React.ReactNode {
	return <HyphenatedTextNativeView text={text} />
}
