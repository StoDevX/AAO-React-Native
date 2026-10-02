import * as React from 'react'
import {Divider, HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {BylineAvatar} from './byline-avatar'
import {bylineDate, bylineText, kickerText} from './lib/byline'
import {ink, faded, messRed} from './palette'
import {PhotoFigure} from './story-blocks'
import type {MessStory} from './types'

/** The section over a headline, in small caps as a newspaper sets it. */
const KICKER = [
	font({textStyle: 'caption', weight: 'bold', smallCaps: true}),
	foregroundStyle(messRed),
	textSelection(true),
]
const HEADLINE = [
	font({textStyle: 'title', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	accessibilityAddTraits(['isHeader']),
	accessibilityIdentifier('mess-story-headline'),
	textSelection(true),
]
const BYLINE = [
	font({textStyle: 'subheadline', design: 'serif'}),
	foregroundStyle(ink),
	textSelection(true),
]
const DATE = [font({textStyle: 'caption'}), foregroundStyle(faded), textSelection(true)]

type Props = {
	story: MessStory
	columnWidth: number
	/** Whether to draw the lead photo; a template that draws the picture itself leaves it out */
	showPhoto?: boolean
}

/** The section and column over a story's title; nothing for a story with no section. */
export function Kicker({story}: {story: MessStory}): React.ReactNode {
	let kicker = kickerText(story)
	return kicker ? <Text modifiers={KICKER}>{kicker}</Text> : null
}

/** The top of a story: kicker, headline, byline and date, and the lead photo. */
export function StoryHeader({story, columnWidth, showPhoto = true}: Props): React.ReactNode {
	let byline = bylineText(story.bylines)
	let date = bylineDate(story.published)

	return (
		<VStack alignment="leading" spacing={10}>
			<Kicker story={story} />
			<Text modifiers={HEADLINE}>{story.title}</Text>
			<Divider />
			<HStack spacing={8}>
				<BylineAvatar writer={story.bylines[0]} />
				<VStack alignment="leading" spacing={2}>
					{byline ? <Text modifiers={BYLINE}>{byline}</Text> : null}
					<Text modifiers={DATE}>{date}</Text>
				</VStack>
			</HStack>
			<Divider />
			{showPhoto && story.photo ? (
				<PhotoFigure columnWidth={columnWidth} photo={story.photo} story={story} />
			) : null}
		</VStack>
	)
}
