import * as React from 'react'
import {Button, HStack, Image, Section, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	foregroundStyle,
	imageScale,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'

import {normalizeLinks} from '../lib/normalize-link'
import type {LabelLink, LabelLinkString} from '../types'
import {DETAIL_ROW, LAST_ROW} from './card-style'
import {SectionHeading} from './section-heading'

/// A headed list of labelled links -- a building's floors, or its other links
/// -- one row each, with a ↗ on the rows that open something.
export function LinkListSection({
	title,
	items,
}: {
	title: string
	// The server is not schema-validated at the boundary, so a record that
	// omits the field arrives as undefined rather than as an empty array.
	// St. Olaf serves these as {label, href} objects where Carleton serves
	// "Label <url>" strings, hence the union -- normalizeLinks reconciles them.
	items: Array<LabelLinkString | LabelLink> | undefined
}): React.ReactNode {
	let links = normalizeLinks(items)
	if (links.length === 0) {
		return null
	}
	return (
		<Section>
			<SectionHeading title={title} />
			{links.map(({label, href}, index) => {
				let row = index === links.length - 1 ? LAST_ROW : DETAIL_ROW
				// Neither field is unique on its own -- two entries can share a
				// label, and a label-only entry has no href at all -- so the key
				// combines both with the row's position.
				let key = `${label}-${href}-${index}`
				if (!href) {
					return (
						<Text key={key} modifiers={row}>
							{label}
						</Text>
					)
				}
				return (
					<Button
						key={key}
						modifiers={[...row, buttonStyle('plain'), accessibilityLabel(`Open ${label}`)]}
						onPress={() => openUrl(href)}
					>
						<HStack>
							<Text>{label}</Text>
							<Spacer />
							{/* Small, so the arrow is no taller than the label and the
							    row keeps Maps' 50pt. */}
							<Image
								modifiers={[
									imageScale('small'),
									foregroundStyle({type: 'hierarchical', style: 'secondary'}),
								]}
								systemName="arrow.up.right"
							/>
						</HStack>
					</Button>
				)
			})}
		</Section>
	)
}
