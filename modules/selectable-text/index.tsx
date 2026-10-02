import * as React from 'react'
import type {ColorValue} from 'react-native'
import {requireNativeView} from 'expo'

/** A stretch of a paragraph sharing one style. Styles nest, so a run can be bold, italic and a link at once. */
export type SelectableTextRun = {
	text: string
	bold?: boolean
	italic?: boolean
	/** Sets the run in the font's own small capitals */
	smallCaps?: boolean
	/** Makes the run a link to this address */
	href?: string
}

/** One paragraph of styled text. */
export type SelectableTextParagraph = {
	runs: SelectableTextRun[]
	/** Sets the whole paragraph in italics, as a quotation is */
	italic?: boolean
	/** How far the paragraph sits in from the leading edge, in points */
	indent?: number
	/** A list item's number or bullet, hung before its first line, its text lined up after it */
	marker?: string
	/** The space after this paragraph, in points, in place of the view's `paragraphSpacing` */
	spacingAfter?: number
}

export type SelectableTextProps = {
	/**
	 * Plain text, whose phone numbers, addresses, links and dates iOS turns
	 * into things to tap. Ignored when `paragraphs` holds any.
	 */
	text?: string
	/** Styled paragraphs, which carry their own links; iOS finds nothing else in them to tap. */
	paragraphs?: SelectableTextParagraph[]
	/** The Dynamic Type style the text is set in; body by default */
	textStyle?: 'body' | 'footnote'
	/** Sets the text in the serif design (New York) rather than the system face */
	serif?: boolean
	/** Sets all the text in italics */
	italic?: boolean
	/** The text's colour; the label colour by default */
	color?: ColorValue
	/** A link's colour; the tint colour by default */
	linkColor?: ColorValue
	/** Extra space between wrapped lines, in points */
	lineSpacing?: number
	/** Space between paragraphs, in points */
	paragraphSpacing?: number
	testID?: string
}

const SelectableTextNativeView: React.ComponentType<SelectableTextProps> = requireNativeView(
	'SelectableText',
	'SelectableTextView',
)

/// A block of text a reader can select across paragraphs, and whose links,
/// when held, offer the system's link menu. A tapped web link goes to the
/// `openURLAction` above it, as a SwiftUI `Text` link does. Renders only
/// inside a `Host`: it is a SwiftUI view, not a React Native one.
export function SelectableText(props: SelectableTextProps): React.ReactNode {
	return <SelectableTextNativeView {...props} />
}
