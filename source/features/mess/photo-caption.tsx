import * as React from 'react'
import {Text} from '@expo/ui/swift-ui'
import {
	accessibilityHidden,
	font,
	foregroundStyle,
	italic,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {faded} from './palette'

/** Names a story's lead photo or a figure in its body, each a button to the zoom viewer, for a UI test. */
export const PHOTO_ID = 'mess-story-photo'

const CAPTION = [
	font({textStyle: 'footnote', design: 'serif'}),
	italic(),
	foregroundStyle(faded),
	textSelection(true),
]
/** A caption its photo's button already reads as its label, so VoiceOver skips it here. */
const CAPTION_READ_BY_PHOTO = [...CAPTION, accessibilityHidden(true)]

/**
 * A photo's caption or credit, under it; nothing when it has none. `readByPhoto` hides it
 * from VoiceOver where the photo's button carries the caption as its label, so it reads once.
 */
export function PhotoCaption({
	caption,
	readByPhoto = false,
}: {
	caption: string
	readByPhoto?: boolean
}): React.ReactNode {
	if (!caption) return null
	return <Text modifiers={readByPhoto ? CAPTION_READ_BY_PHOTO : CAPTION}>{caption}</Text>
}
