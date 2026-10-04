import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'

import {DisclosureRow} from '../../components/rows'
import {iconImage, opensInBrowser, type ViewType} from '../views'

/**
 * Home as a Settings-style list: a row per tile, in the tiled home's order,
 * each led by its symbol in white on the tile's own gradient. Rendered inside
 * a `List`, which the caller owns so it can put the FAQ banner and the notice
 * around these.
 */
export function HomeListRows({
	views,
	onOpen,
}: {
	views: ViewType[]
	onOpen: (view: ViewType) => void
}): React.ReactNode {
	return (
		<Section>
			{views.map((view) => (
				<DisclosureRow
					key={view.title}
					destination={opensInBrowser(view) ? 'external' : 'push'}
					image={{...iconImage(view.icon), gradient: view.gradient}}
					onPress={() => onOpen(view)}
					title={view.title}
				/>
			))}
		</Section>
	)
}
