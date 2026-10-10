import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'

import {DisclosureRow} from '../../components/rows'
import {iconImage, opensInBrowser, type ViewType} from '../views'

/**
 * Home as a Settings-style list: a row per tile, in the tiled home's order,
 * each led by its symbol in white on the tile's own gradient. Rendered inside
 * a `List`, which the caller owns so it can put the FAQ banner above these.
 *
 * `footer` hangs below the rows. It is a footer rather than a row of its own
 * because an inset-grouped list clips each section's rows to the section's
 * rounded card, so a loose row with a shape of its own loses its corners to the
 * card's; a footer sits outside the card and keeps them.
 */
export function HomeListRows({
	views,
	onOpen,
	footer,
	title,
}: {
	views: ViewType[]
	onOpen: (view: ViewType) => void
	footer?: React.ReactNode
	/**
	 * The section's heading, for a tile group. Each row's spoken label ends
	 * with it, as a tile's does on the tiled Home.
	 */
	title?: string
}): React.ReactNode {
	return (
		<Section footer={footer} title={title}>
			{views.map((view) => (
				<DisclosureRow
					key={view.title}
					destination={opensInBrowser(view) ? 'external' : 'push'}
					image={{...iconImage(view.icon), gradient: view.gradient}}
					onPress={() => onOpen(view)}
					spokenTitle={title ? `${view.title}, ${title}` : undefined}
					title={view.title}
				/>
			))}
		</Section>
	)
}
