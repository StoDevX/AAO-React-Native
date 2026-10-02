import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'

import {DisclosureRow} from '../../components/rows'
import {iconImage, opensInBrowser, type HomeSection, type ViewType} from '../views'

/**
 * Home as a Settings-style list: a section per group, a row per tile, each
 * row led by its symbol in white on the tile's own gradient. Rendered inside a
 * `List`, which the caller owns so it can put the FAQ banner and the notice
 * around these.
 */
export function HomeListSections({
	sections,
	onOpen,
}: {
	sections: HomeSection[]
	onOpen: (view: ViewType) => void
}): React.ReactNode {
	return sections.map((section) => (
		<Section key={section.id} title={section.title}>
			{section.views.map((view) => (
				<DisclosureRow
					key={view.id}
					destination={opensInBrowser(view) ? 'external' : 'push'}
					image={{...iconImage(view.icon), badge: view.gradient}}
					onPress={() => onOpen(view)}
					title={view.title}
				/>
			))}
		</Section>
	))
}
