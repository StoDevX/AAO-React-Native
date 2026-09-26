import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, textSelection} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {faded, ink} from './palette'
import {staffProfileOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {Byline} from './types'

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

/** A writer's photo and bio. Draws nothing for a writer with no staff profile. */
export function AuthorCard({byline}: {byline: Byline}): React.ReactNode {
	let {data: profile} = useQuery(staffProfileOptions(byline.id))
	if (!profile) return null

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
