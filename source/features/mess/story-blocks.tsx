import * as React from 'react'
import {Button, HStack, Image, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	italic,
	padding,
	textSelection,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import type {SFSymbol} from 'sf-symbols-typescript'
import {runsToMarkdown} from './lib/markdown'
import {splitOpening} from './lib/opening'
import {faded, ink, messRed, onMessRed} from './palette'
import {RemotePhoto} from './remote-photo'
import type {Block, MessStory, Run} from './types'

export const BODY_ID = 'mess-story-body'
const BODY = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink)]
/** Body text that can hold a link, which SwiftUI draws in the tint colour. */
const PROSE = [...BODY, tint(messRed), accessibilityIdentifier(BODY_ID), textSelection(true)]
const QUOTE = [
	font({textStyle: 'body', design: 'serif'}),
	italic(),
	foregroundStyle(ink),
	tint(messRed),
	padding({leading: 16}),
	accessibilityIdentifier(BODY_ID),
	textSelection(true),
]
const CAPTION = [
	font({textStyle: 'footnote', design: 'serif'}),
	italic(),
	foregroundStyle(faded),
	textSelection(true),
]
/** A story's opening words, in the font's own small capitals. */
const OPENING = [font({textStyle: 'body', design: 'serif', smallCaps: true})]
const SITE_LINK = [font({textStyle: 'callout', weight: 'semibold'}), foregroundStyle(messRed)]
const SITE_LINK_ICON = [foregroundStyle(messRed)]

/** A paragraph of body text, drawn from its runs as Markdown. */
export function Paragraph({
	runs,
	modifiers = PROSE,
}: {
	runs: Run[]
	modifiers?: typeof PROSE
}): React.ReactNode {
	return (
		<Text markdownEnabled={true} modifiers={modifiers}>
			{runsToMarkdown(runs)}
		</Text>
	)
}

/**
 * A story's first paragraph, its opening words set in small caps the way a
 * newspaper sets them. A paragraph that opens with styled text is drawn as it is.
 */
function OpeningParagraph({runs}: {runs: Run[]}): React.ReactNode {
	let {opening, rest} = splitOpening(runs)
	if (opening === '') return <Paragraph runs={runs} />

	return (
		<Text modifiers={PROSE}>
			<Text modifiers={OPENING}>{opening}</Text>
			<Text markdownEnabled={true}>{runsToMarkdown(rest)}</Text>
		</Text>
	)
}

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
	/** Fills the card in the Mess red, for the one thing its page is for, such as solving a crossword */
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

type Props = {
	block: Block
	columnWidth: number
	storyLink: string
	/** Whether this block opens the story, and so sets its first words in small caps */
	isOpening?: boolean
}

/** One block of a story body. */
export function StoryBlock({
	block,
	columnWidth,
	storyLink,
	isOpening = false,
}: Props): React.ReactNode {
	switch (block.type) {
		case 'paragraph':
			return isOpening ? <OpeningParagraph runs={block.runs} /> : <Paragraph runs={block.runs} />
		case 'quote':
			return <Paragraph modifiers={QUOTE} runs={block.runs} />
		case 'list':
			return (
				<VStack alignment="leading" spacing={6}>
					{block.items.map((runs, index) => (
						// oxlint-disable-next-line react/no-array-index-key -- an item's place in the list is its identity, and the number it shows
						<HStack alignment="firstTextBaseline" key={index} spacing={8}>
							<Text modifiers={BODY}>{block.ordered ? `${index + 1}.` : '•'}</Text>
							<Paragraph runs={runs} />
						</HStack>
					))}
				</VStack>
			)
		case 'figure':
			return (
				<VStack alignment="leading" spacing={4}>
					<RemotePhoto
						height={Math.round((columnWidth * block.height) / block.width)}
						url={block.url}
						width={columnWidth}
					/>
					<PhotoCaption caption={block.caption} />
				</VStack>
			)
		case 'embed':
			return (
				<SiteLinkCard
					icon="play.rectangle"
					label="Open the playlist or video on the web"
					url={storyLink}
				/>
			)
		default: {
			// Every block type is drawn above; a new one stops the compiler here.
			let _unhandled: never = block
			return null
		}
	}
}

type StoryBlocksProps = {story: MessStory; columnWidth: number}

/** A story's blocks in reading order, returned side by side to land in the page's column. */
export function StoryBlocks({story, columnWidth}: StoryBlocksProps): React.ReactNode {
	// The first paragraph opens the story, even when a photo comes before it.
	let openingIndex = story.blocks.findIndex((block) => block.type === 'paragraph')
	return story.blocks.map((block, index) => (
		<StoryBlock
			block={block}
			columnWidth={columnWidth}
			isOpening={index === openingIndex}
			// oxlint-disable-next-line react/no-array-index-key -- blocks have no id; a story's body is fixed, so its order is its identity
			key={index}
			storyLink={story.link}
		/>
	))
}

/** A photo's caption or credit, under it; nothing when it has none. */
export function PhotoCaption({caption}: {caption: string}): React.ReactNode {
	return caption ? <Text modifiers={CAPTION}>{caption}</Text> : null
}
