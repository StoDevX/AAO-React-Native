import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'

import {DisclosureRow} from '../../components/rows'
import {iconImage, opensInBrowser, type HomeSection, type ViewType} from '../views'

/**
 * Home as a Settings-style list: a section per group, a row per tile, each
 * row led by its symbol in white on the tile's own gradient. Rendered inside a
 * `List`, which the caller owns so it can put the FAQ banner above these.
 *
 * `footer` hangs below the last section. It is a footer rather than a row of
 * its own because an inset-grouped list clips each section's rows to the
 * section's rounded card, so a loose row with a shape of its own loses its
 * corners to the card's; a footer sits outside the card and keeps them.
 */
export function HomeListSections({
	sections,
	onOpen,
	footer,
}: {
	sections: HomeSection[]
	onOpen: (view: ViewType) => void
	footer?: React.ReactNode
}): React.ReactNode {
	// With every group hidden there is no last section to carry the footer, so
	// it gets an empty one, which draws no card.
	if (sections.length === 0) {
		return footer ? <Section footer={footer}>{null}</Section> : null
	}

	return sections.map((section, index) => (
		<Section
			key={section.id}
			footer={index === sections.length - 1 ? footer : undefined}
			title={section.title}
		>
			{section.views.map((view) => (
				<DisclosureRow
					key={view.id}
					destination={opensInBrowser(view) ? 'external' : 'push'}
					image={{...iconImage(view.icon), gradient: view.gradient}}
					onPress={() => onOpen(view)}
					title={view.title}
				/>
			))}
		</Section>
	))
}
