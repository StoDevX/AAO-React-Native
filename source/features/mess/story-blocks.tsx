import * as React from 'react'
import {Button, HStack, Image, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityHidden,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	italic,
	textSelection,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {SelectableText, type SelectableTextProps} from '@frogpond/selectable-text'
import type {SFSymbol} from 'sf-symbols-typescript'
import {FramedPhoto, ViewerButton} from './image-view'
import {photoLabel} from './lib/byline'
import {runsToMarkdown} from './lib/markdown'
import {bodyParts} from './lib/prose'
import {faded, ink, messRed, onMessRed} from './palette'
import {RemotePhoto} from './remote-photo'
import type {Block, CaptionedPhoto, MessStory, Run} from './types'

export const BODY_ID = 'mess-story-body'
/** The space between the parts of a story's column, and so between the paragraphs of its prose. */
export const BLOCK_SPACING = 14
/** Body text that can hold a link, which SwiftUI draws in the tint colour. */
const PROSE = [
	font({textStyle: 'body', design: 'serif'}),
	foregroundStyle(ink),
	tint(messRed),
	accessibilityIdentifier(BODY_ID),
	textSelection(true),
]
const CAPTION = [
	font({textStyle: 'footnote', design: 'serif'}),
	italic(),
	foregroundStyle(faded),
	textSelection(true),
]
/** A caption its photo's button already reads as its label, so VoiceOver skips it here. */
const CAPTION_READ_BY_PHOTO = [...CAPTION, accessibilityHidden(true)]

/** How a stretch of a story's prose is set: its text style, slant, colour and line spacing. */
export type ProseStyle = Pick<SelectableTextProps, 'textStyle' | 'italic' | 'color' | 'lineSpacing'>
/** A story's prose, as body text. */
export const BODY_PROSE: ProseStyle = {textStyle: 'body', color: ink}
const SITE_LINK = [font({textStyle: 'callout', weight: 'semibold'}), foregroundStyle(messRed)]
const SITE_LINK_ICON = [foregroundStyle(messRed)]

/** A section's heading, in small capitals as a newspaper sets one: a series row's, or a recipe's. */
export const SECTION_HEADING = [
	font({textStyle: 'headline', design: 'serif', smallCaps: true}),
	foregroundStyle(ink),
	accessibilityAddTraits(['isHeader']),
]

/** A paragraph of body text on its own, drawn from its runs as Markdown, as a horoscope's is. */
export function Paragraph({runs}: {runs: Run[]}): React.ReactNode {
	return (
		<Text markdownEnabled={true} modifiers={PROSE}>
			{runsToMarkdown(runs)}
		</Text>
	)
}

/** Names a story's lead photo or a figure in its body, each a button to the zoom viewer, for a UI test. */
export const PHOTO_ID = 'mess-story-photo'

/** Names the card that sends a story to olafmessenger.com, for a UI test. */
export const SITE_LINK_ID = 'mess-story-site-link'

/** A prominent card's label and icon, in a colour that reads on the card's red in either appearance. */
const PROMINENT_LINK = [
	font({textStyle: 'callout', weight: 'semibold'}),
	foregroundStyle(onMessRed),
]
const PROMINENT_LINK_ICON = [foregroundStyle(onMessRed)]

type SiteLinkProps = {
	icon: SFSymbol
	label: string
	url: string
	/** Fills the card in the Mess red, for the one thing its page is for, such as solving a puzzle */
	prominent?: boolean
	/** The card's name for a UI test */
	identifier?: string
	/** How the card opens its page; by default the app's link setting decides, through `openUrl` */
	open?: (url: string) => unknown
}

/**
 * A card that opens a web page: the story on olafmessenger.com for what the reader cannot
 * show, or where a page's puzzle or playlist lives.
 */
export function SiteLinkCard({
	icon,
	label,
	url,
	prominent = false,
	identifier = SITE_LINK_ID,
	open = openUrl,
}: SiteLinkProps): React.ReactNode {
	return (
		<Button
			modifiers={[
				buttonStyle(prominent ? 'borderedProminent' : 'bordered'),
				controlSize('large'),
				...(prominent ? [tint(messRed)] : []),
				accessibilityLabel(label),
				accessibilityIdentifier(identifier),
			]}
			onPress={() => open(url)}
		>
			<HStack spacing={8}>
				<Image modifiers={prominent ? PROMINENT_LINK_ICON : SITE_LINK_ICON} systemName={icon} />
				<Text modifiers={prominent ? PROMINENT_LINK : SITE_LINK}>{label}</Text>
			</HStack>
		</Button>
	)
}

type StoryBlocksProps = {
	story: MessStory
	columnWidth: number
	/** The blocks to draw, where a template draws the rest of the body itself; by default the story's own */
	blocks?: Block[]
	/** Whether the first paragraph opens the story, its first words in small caps */
	opens?: boolean
	/** How the prose is set; by default as body text */
	prose?: ProseStyle
}

/**
 * A story's blocks in reading order, returned side by side to land in the page's column. Each
 * stretch of prose between figures is one text view, so a reader's selection can run from
 * one paragraph into the next, and stops at a photo.
 */
export function StoryBlocks({
	story,
	columnWidth,
	blocks = story.blocks,
	opens = true,
	prose = BODY_PROSE,
}: StoryBlocksProps): React.ReactNode {
	return bodyParts(blocks, {opens}).map((part, index) =>
		part.kind === 'prose' ? (
			<SelectableText
				// oxlint-disable-next-line react/no-array-index-key -- blocks have no id; a story's body is fixed, so its order is its identity
				key={index}
				linkColor={messRed}
				paragraphSpacing={BLOCK_SPACING}
				paragraphs={part.paragraphs}
				serif={true}
				testID={BODY_ID}
				{...prose}
			/>
		) : part.block.type === 'figure' ? (
			// oxlint-disable-next-line react/no-array-index-key -- as above
			<PhotoFigure columnWidth={columnWidth} key={index} photo={part.block} story={story} />
		) : (
			<SiteLinkCard
				icon="play.rectangle"
				// oxlint-disable-next-line react/no-array-index-key -- as above
				key={index}
				label="Open the playlist or video on the web"
				url={story.link}
			/>
		),
	)
}

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

type PhotoFigureProps = {
	story: MessStory
	/** The story's lead photo, or a figure in its body */
	photo: CaptionedPhoto
	columnWidth: number
	/** Mounts the photo in a hairline frame, as a playlist's picture is */
	framed?: boolean
}

/** A story's photo at the column's width, with its caption under it; tapping it opens the zoom viewer. */
export function PhotoFigure({
	story,
	photo,
	columnWidth,
	framed = false,
}: PhotoFigureProps): React.ReactNode {
	let height = Math.round((columnWidth * photo.height) / photo.width)
	let Photo = framed ? FramedPhoto : RemotePhoto
	return (
		<VStack alignment="leading" spacing={4}>
			<ViewerButton
				identifier={PHOTO_ID}
				label={photoLabel(story, photo.caption)}
				// The viewer finds the photo by its address, which names it wherever in the story it sits.
				params={{id: String(story.id), url: photo.url}}
			>
				<Photo height={height} url={photo.url} width={columnWidth} />
			</ViewerButton>
			{/* The button is labelled by this caption whenever there is one. */}
			<PhotoCaption caption={photo.caption} readByPhoto={true} />
		</VStack>
	)
}
