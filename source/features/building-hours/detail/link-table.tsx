/**
 * <LinkTable/> renders the table of building-related links.
 */

import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {openUrl} from '@frogpond/open-url'
import {ActionRow} from '../../../components/rows'
import type {BuildingLinkType} from '../types'

type Props = {
	links: BuildingLinkType[]
}

/**
 * Rows rather than disclosure rows: each one opens a web page outside the app,
 * so there is nowhere in the stack for a chevron to point.
 *
 * Drawn as a `Section` rather than its own list -- the detail sheet already
 * holds one, and a list inside a list draws a second card.
 */
export function LinkTable(props: Props): React.ReactElement {
	return (
		<Section title="Resources">
			{props.links.map((link) => (
				<ActionRow
					key={link.url.toString()}
					onPress={() => openUrl(link.url.toString())}
					title={link.title}
				/>
			))}
		</Section>
	)
}
