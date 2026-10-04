import * as React from 'react'
import {
	EnrichedMarkdownText,
	type LinkPressEvent,
	type MarkdownStyle,
} from 'react-native-enriched-markdown'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

// `c.label`/`c.link` are `PlatformColor(...)` objects. `MarkdownStyle`'s
// public type declares `color?: string`, but the library's own
// `normalizeMarkdownStyle` pipes colors through RN's `processColor()` into
// the Fabric codegen schema, which types color props as real `ColorValue` —
// so `PlatformColor` values work at runtime and adapt to the system color
// scheme automatically. The cast below only satisfies the narrower public type.
const label = c.label as unknown as string
const link = c.link as unknown as string
const secondarySystemBackground = c.secondarySystemBackground as unknown as string
const separator = c.separator as unknown as string

/**
 * The body text style's default size, where the library's own is 16, so running
 * text in markdown matches the SwiftUI text elsewhere in the app.
 */
const BODY_SIZE = 17

const baseMarkdownStyle: MarkdownStyle = {
	paragraph: {color: label, fontSize: BODY_SIZE},
	h1: {color: label},
	h2: {color: label},
	h3: {color: label},
	h4: {color: label},
	h5: {color: label},
	h6: {color: label},
	strong: {color: label},
	em: {color: label},
	blockquote: {
		color: label,
		fontSize: BODY_SIZE,
		backgroundColor: secondarySystemBackground,
		borderColor: separator,
	},
	list: {color: label, fontSize: BODY_SIZE},
	code: {
		color: label,
		backgroundColor: secondarySystemBackground,
		borderColor: separator,
	},
	link: {color: link},
}

// `react-native-enriched-markdown`'s parser pairs `$...$` as a math node by
// default, even though the native math renderer is compiled out via
// `enableMath: false` in package.json's `enriched-markdown` block. With the renderer gone but the
// parser still matching, text between `$` characters silently disappears
// instead of rendering literally. Disabling `latexMath` keeps `$` as a plain
// character, matching the renderer's compiled-out math support.
const md4cFlags = {latexMath: false}

function mergeMarkdownStyle(base: MarkdownStyle, override: MarkdownStyle): MarkdownStyle {
	const merged: Record<string, object> = {...base}
	for (const [key, value] of Object.entries(override) as [string, object][]) {
		merged[key] = {...(base as Record<string, object>)[key], ...value}
	}
	return merged
}

function handleLinkPress(event: LinkPressEvent): void {
	openUrl(event.url)
}

export type MarkdownProps = {
	source: string
	markdownStyle?: MarkdownStyle
}

export function Markdown({source, markdownStyle}: MarkdownProps): React.ReactNode {
	let style = markdownStyle
		? mergeMarkdownStyle(baseMarkdownStyle, markdownStyle)
		: baseMarkdownStyle

	return (
		<EnrichedMarkdownText
			flavor="github"
			markdown={source}
			markdownStyle={style}
			md4cFlags={md4cFlags}
			onLinkPress={handleLinkPress}
		/>
	)
}
