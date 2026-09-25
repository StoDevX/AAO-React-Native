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
	tint,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import type {SFSymbol} from 'sf-symbols-typescript'
import {runsToMarkdown} from './lib/markdown'
import {splitOpening} from './lib/opening'
import {faded, ink, messRed} from './palette'
import {RemotePhoto} from './remote-photo'
import type {Block, Run} from './types'

const BODY_ID = 'mess-story-body'
const BODY = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink)]
/** Body text that can hold a link, which SwiftUI draws in the tint colour. */
const PROSE = [...BODY, tint(messRed), accessibilityIdentifier(BODY_ID)]
const QUOTE = [
	font({textStyle: 'body', design: 'serif'}),
	italic(),
	foregroundStyle(ink),
	tint(messRed),
	padding({leading: 16}),
	accessibilityIdentifier(BODY_ID),
]
const CAPTION = [font({textStyle: 'footnote', design: 'serif'}), italic(), foregroundStyle(faded)]
/** A story's opening words, in the font's own small capitals. */
const OPENING = [font({textStyle: 'body', design: 'serif', smallCaps: true})]
const SITE_LINK = [font({textStyle: 'callout', weight: 'semibold'}), foregroundStyle(messRed)]
const SITE_LINK_ICON = [foregroundStyle(messRed)]

function Paragraph({
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

type SiteLinkProps = {
	icon: SFSymbol
	label: string
	url: string
}

/** A bordered card that opens a page on olafmessenger.com, for what the reader cannot show. */
export function SiteLinkCard({icon, label, url}: SiteLinkProps): React.ReactNode {
	return (
		<Button
			modifiers={[
				buttonStyle('bordered'),
				controlSize('large'),
				accessibilityLabel(label),
				accessibilityIdentifier('mess-story-site-link'),
			]}
			onPress={() => openUrl(url)}
		>
			<HStack spacing={8}>
				<Image modifiers={SITE_LINK_ICON} systemName={icon} />
				<Text modifiers={SITE_LINK}>{label}</Text>
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
					{block.caption ? <Text modifiers={CAPTION}>{block.caption}</Text> : null}
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
