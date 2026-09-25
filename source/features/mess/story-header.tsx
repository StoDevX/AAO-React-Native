import * as React from 'react'
import {Divider, HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	italic,
	textCase,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {bylineText, kickerText} from './lib/byline'
import {ink, faded, messRed} from './palette'
import {staffProfileOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {MessStory} from './types'

const KICKER = [
	font({textStyle: 'caption', weight: 'bold'}),
	textCase('uppercase'),
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

type Props = {story: MessStory; columnWidth: number}

/** The top of a story: kicker, headline, byline and date, and the lead photo. */
export function StoryHeader({story, columnWidth}: Props): React.ReactNode {
	let kicker = kickerText(story)
	let byline = bylineText(story.bylines)
	let firstWriter = story.bylines[0]
	let profile = useQuery({
		...staffProfileOptions(firstWriter?.id ?? 0),
		enabled: firstWriter !== undefined,
	})
	let date = new Date(story.published).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})

	return (
		<VStack alignment="leading" spacing={10}>
			{kicker ? <Text modifiers={KICKER}>{kicker}</Text> : null}
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
			{story.photo ? (
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
