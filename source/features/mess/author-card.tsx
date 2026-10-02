import * as React from 'react'
import {Divider, HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	font,
	foregroundStyle,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {useQueries} from '@tanstack/react-query'
import {faded, ink} from './palette'
import {staffProfileOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {Byline, StaffProfile} from './types'

const NAME = [
	font({textStyle: 'headline', design: 'serif'}),
	foregroundStyle(ink),
	textSelection(true),
]
const BIO = [
	font({textStyle: 'footnote', design: 'serif'}),
	foregroundStyle(faded),
	textSelection(true),
]
const PHOTO = 44

/** Names the rule above the writers' cards, for a test. */
export const AUTHOR_RULE_ID = 'mess-author-rule'
const RULE = [accessibilityIdentifier(AUTHOR_RULE_ID)]

/**
 * A rule, then a card for each writer with a staff profile. Draws nothing, rule included,
 * until a profile has arrived: a page whose writers have none ends with no stray rule, and
 * one whose profiles are still loading never draws a rule that may then go.
 */
export function AuthorCards({bylines}: {bylines: Byline[]}): React.ReactNode {
	let profiles = useQueries({
		queries: bylines.map((byline) => staffProfileOptions(byline.id)),
		combine: (results) => results.map((result) => result.data),
	})
	let cards = bylines.flatMap((byline, i) => {
		let profile = profiles[i]
		return profile ? [<AuthorCard key={byline.id} profile={profile} />] : []
	})
	if (cards.length === 0) return null

	return (
		<>
			<Divider modifiers={RULE} />
			{cards}
		</>
	)
}

/** A writer's photo and bio. */
function AuthorCard({profile}: {profile: StaffProfile}): React.ReactNode {
	return (
		<HStack alignment="top" spacing={10}>
			{profile.photo ? (
				<RemotePhoto height={PHOTO} round={true} url={profile.photo.url} width={PHOTO} />
			) : null}
			<VStack alignment="leading" spacing={3}>
				<Text modifiers={NAME}>{profile.name}</Text>
				<Text modifiers={BIO}>{profile.bio}</Text>
			</VStack>
		</HStack>
	)
}
