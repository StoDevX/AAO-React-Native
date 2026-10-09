import * as React from 'react'
import {Circle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, foregroundStyle, frame} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {wash} from './palette'
import {usePaperQueries} from './use-paper-queries'
import {RemotePhoto} from './remote-photo'
import type {Byline} from './types'

const AVATAR = 30

const PLACEHOLDER = [
	frame({width: AVATAR, height: AVATAR}),
	foregroundStyle(wash),
	accessibilityIdentifier('mess-byline-avatar-placeholder'),
]

/**
 * The photo beside a byline, from the writer's staff profile. A blank circle
 * holds its place while the profile loads, so the byline does not move when
 * the photo arrives. A writer with no photo gets nothing, not a gap: many
 * writers have no profile at all.
 */
export function BylineAvatar({writer}: {writer: Byline | undefined}): React.ReactNode {
	let {staffProfileOptions} = usePaperQueries()
	let profile = useQuery({
		...staffProfileOptions(writer?.id ?? 0),
		enabled: writer !== undefined,
	})

	if (profile.data?.photo) {
		return <RemotePhoto height={AVATAR} round={true} url={profile.data.photo.url} width={AVATAR} />
	}
	// A query with no writer to ask about is pending forever, so it waits on nothing.
	if (writer !== undefined && profile.isPending) {
		return <Circle modifiers={PLACEHOLDER} />
	}
	return null
}
