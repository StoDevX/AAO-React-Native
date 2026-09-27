import * as React from 'react'
import {Linking} from 'react-native'
import {Button, LabeledContent, Section, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	foregroundStyle,
	shapes,
} from '@expo/ui/swift-ui/modifiers'

import {appleMapsSearchUrl} from '../urls'
import {LAST_ROW} from '../../../components/place-card/card-style'
import {SectionHeading} from '../../../components/place-card/section-heading'

/// Label/value rows, as in Maps' Details: the label grey on the left, the
/// value on the right, the value under the label at accessibility text sizes.
/// A building's address is the only such value the feeds carry, and only
/// Carleton's.
export function DetailsSection({address}: {address: string | null}): React.ReactNode {
	if (!address) {
		return null
	}
	// Linking rather than openUrl: maps.apple.com is a universal link that iOS
	// hands to Maps.app, and openUrl would offer to show it in the in-app
	// browser instead, which lands on Apple's web fallback page.
	let openAddress = () => {
		let url = appleMapsSearchUrl(address)
		Linking.openURL(url).catch((err: unknown) => {
			console.warn(`could not open ${url}`, err)
		})
	}
	return (
		<Section>
			<SectionHeading title="Details" />
			<Button
				modifiers={[
					...LAST_ROW,
					buttonStyle('plain'),
					accessibilityLabel(`Open ${address} in Maps`),
				]}
				onPress={openAddress}
			>
				<LabeledContent
					modifiers={[contentShape(shapes.rectangle())]}
					label={
						<Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'secondary'})]}>
							Address
						</Text>
					}
				>
					<Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
						{address}
					</Text>
				</LabeledContent>
			</Button>
		</Section>
	)
}
