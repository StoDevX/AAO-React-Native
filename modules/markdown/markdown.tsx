import * as React from 'react'
import {
	EnrichedMarkdownText,
	type LinkPressEvent,
	type MarkdownStyle,
} from 'react-native-enriched-markdown'
import {openUrl} from '@frogpond/open-url'
import {type MarkdownColors, useMarkdownColors} from './theme'

/**
 * The body text style's default size, where the library's own is 16, so running
 * text in markdown matches the SwiftUI text elsewhere in the app.
 */
const BODY_SIZE = 17

/** The library's style for each element, in the given colours. */
function baseMarkdownStyle({
	label,
	link,
	secondarySystemBackground,
	separator,
}: MarkdownColors): MarkdownStyle {
	return {
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
	void openUrl(event.url)
}

export type MarkdownProps = {
	source: string
	markdownStyle?: MarkdownStyle
}

export function Markdown({source, markdownStyle}: MarkdownProps): React.ReactNode {
	let colors = useMarkdownColors()
	let style = React.useMemo(() => {
		let base = baseMarkdownStyle(colors)
		return markdownStyle ? mergeMarkdownStyle(base, markdownStyle) : base
	}, [colors, markdownStyle])

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
