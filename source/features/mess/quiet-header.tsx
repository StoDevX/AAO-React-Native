import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	italic,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {BylineAvatar} from './byline-avatar'
import {creditLine} from './lib/byline'
import {faded, ink} from './palette'
import {Kicker} from './story-header'
import type {MessStory} from './types'

const TITLE = [
	font({textStyle: 'title2', design: 'serif', weight: 'regular'}),
	italic(),
	foregroundStyle(ink),
	accessibilityAddTraits(['isHeader']),
	accessibilityIdentifier('mess-story-headline'),
	textSelection(true),
]
const CREDIT = [font({textStyle: 'caption'}), foregroundStyle(faded), textSelection(true)]

/**
 * The top of a poem, photo or short story: kicker, an italic title, and one light
 * line of writers and date beside the first writer's photo, as a news story shows it.
 * It leaves out the rules, so the poem or picture is the loudest thing on the page.
 */
export function QuietHeader({story}: {story: MessStory}): React.ReactNode {
	return (
		<VStack alignment="leading" spacing={8}>
			<Kicker story={story} />
			<Text modifiers={TITLE}>{story.title}</Text>
			<HStack spacing={8}>
				<BylineAvatar writer={story.bylines[0]} />
				<Text modifiers={CREDIT}>{creditLine(story)}</Text>
			</HStack>
		</VStack>
	)
}
