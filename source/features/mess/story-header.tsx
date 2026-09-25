import * as React from 'react'
import {Divider, HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	italic,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {bylineDate, bylineText, kickerText} from './lib/byline'
import {ink, faded, messRed} from './palette'
import {staffProfileOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {MessStory} from './types'

/** The section over a headline, in small caps as a newspaper sets it. */
const KICKER = [
	font({textStyle: 'caption', weight: 'bold', smallCaps: true}),
	foregroundStyle(messRed),
]
const HEADLINE = [
	font({textStyle: 'title', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	accessibilityAddTraits(['isHeader']),
	accessibilityIdentifier('mess-story-headline'),
]
const BYLINE = [font({textStyle: 'subheadline', design: 'serif'}), foregroundStyle(ink)]
const DATE = [font({textStyle: 'caption'}), foregroundStyle(faded)]
const CAPTION = [font({textStyle: 'footnote', design: 'serif'}), italic(), foregroundStyle(faded)]

const AVATAR = 30

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
	let firstWriter = story.bylines[0]
	let profile = useQuery({
		...staffProfileOptions(firstWriter?.id ?? 0),
		enabled: firstWriter !== undefined,
	})
	let date = bylineDate(story.published)

	return (
		<VStack alignment="leading" spacing={10}>
			<Kicker story={story} />
			<Text modifiers={HEADLINE}>{story.title}</Text>
			<Divider />
			<HStack spacing={8}>
				{profile.data?.photo ? (
					<RemotePhoto height={AVATAR} round={true} url={profile.data.photo.url} width={AVATAR} />
				) : null}
				<VStack alignment="leading" spacing={2}>
					{byline ? <Text modifiers={BYLINE}>{byline}</Text> : null}
					<Text modifiers={DATE}>{date}</Text>
				</VStack>
			</HStack>
			<Divider />
			{showPhoto && story.photo ? (
				<VStack alignment="leading" spacing={4}>
					<RemotePhoto
						height={Math.round((columnWidth * story.photo.height) / story.photo.width)}
						url={story.photo.url}
						width={columnWidth}
					/>
					{story.photo.caption ? <Text modifiers={CAPTION}>{story.photo.caption}</Text> : null}
				</VStack>
			) : null}
		</VStack>
	)
}
