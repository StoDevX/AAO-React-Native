import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {NoticeView} from '@frogpond/notice'
import type {SFSymbol} from 'sf-symbols-typescript'

import {campusById} from '../../campuses'
import type {CampusDefinition} from '../../campuses/definition'
import {useCampusParam} from './campus-param'

/** The sections a campus may leave out; leaving one out leaves out its feature. */
export type OptionalSection = {
	[K in keyof CampusDefinition]-?: undefined extends CampusDefinition[K] ? K : never
}[keyof CampusDefinition]

/** What a screen says in place of itself, on a campus without its section. */
export type SectionNotice = {
	/** The screen's title, which the notice reads as "No <title>". */
	title: string
	/** What the feature shows, as "doesn't have <noun> for <college> yet". */
	noun: string
	systemImage: SFSymbol
}

/** A route screen that draws only for a campus with `requiredSection`. */
export type GatedScreen<P> = React.ComponentType<P> & {requiredSection: OptionalSection}

/**
 * Wraps a route's screen so that, for a campus without `section`, it says so
 * rather than drawing. The campus is the one the link names (`?campus=`), else
 * the active one, so a link to a feature this campus lacks lands on the notice.
 */
export function requiresSection<P extends object>(
	section: OptionalSection,
	notice: SectionNotice,
	Screen: React.ComponentType<P>,
): GatedScreen<P> {
	function Gated(props: P): React.ReactNode {
		let {campus: param} = useLocalSearchParams<{campus?: string}>()
		let campus = campusById(useCampusParam(param))

		if (campus[section] === undefined) {
			let {appName, college} = campus.branding
			return (
				<>
					<Stack.Title>{notice.title}</Stack.Title>
					<NoticeView
						description={`${appName} doesn't have ${notice.noun} for ${college} yet.`}
						systemImage={notice.systemImage}
						title={`No ${notice.title}`}
					/>
				</>
			)
		}

		return <Screen {...props} />
	}
	Gated.displayName = `requiresSection(${section})`

	return Object.assign(Gated, {requiredSection: section})
}
