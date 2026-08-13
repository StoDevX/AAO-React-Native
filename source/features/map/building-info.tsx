import * as React from 'react'
import {Image as RNImage, Linking, StyleSheet} from 'react-native'
import {
	Button,
	Host,
	HStack,
	List,
	RNHostView,
	Section,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	font,
	foregroundStyle,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

import {parseLinkString} from './lib/parse-link-string'
import type {Building, Feature, LabelLinkString} from './types'
import {buildingPhotoUrl} from './urls'

type Props = {
	building: Feature<Building> | undefined
	onClose: () => void
}

/// SwiftUI, for the same reason the picker is: this renders inside a
/// react-native-screens `formSheet`, whose full-detent bounds React Native does
/// not lay out correctly. See `building-picker.tsx`.
export function BuildingInfo({building, onClose}: Props): React.ReactNode {
	if (!building) {
		return (
			<Host style={styles.host}>
				<List>
					<Section>
						<Text>Building not found.</Text>
						<Button modifiers={[accessibilityLabel('Close')]} onPress={onClose}>
							<Text>Close</Text>
						</Button>
					</Section>
				</List>
			</Host>
		)
	}

	let {
		accessibility,
		address,
		departments,
		description,
		floors,
		name,
		nickname,
		offices,
		photos,
	} = building.properties

	return (
		<Host style={styles.host}>
			<List>
				<Section>
					{/* `center`, so the name sits on the same axis as Close rather than
					    riding up against the top of the row. */}
					<HStack alignment="center" spacing={12}>
						<VStack alignment="leading" spacing={2}>
							<Text modifiers={[font({textStyle: 'title2', weight: 'bold'})]}>
								{name}
							</Text>
							{nickname ? (
								<Text
									modifiers={[
										font({textStyle: 'subheadline'}),
										foregroundStyle({type: 'hierarchical', style: 'secondary'}),
									]}
								>
									{nickname}
								</Text>
							) : null}
						</VStack>
						<Spacer />
						<Button modifiers={[accessibilityLabel('Close')]} onPress={onClose}>
							<Text>Close</Text>
						</Button>
					</HStack>
				</Section>

				{photos?.[0] ? (
					<Section>
						{/* SwiftUI's Image reads a local file synchronously; these are
						    remote, so the React Native image loader does the work and
						    SwiftUI hosts the result. */}
						<RNHostView matchContents={true}>
							<RNImage
								accessibilityLabel={`Photo of ${name}`}
								source={{uri: buildingPhotoUrl(photos[0])}}
								style={styles.photo}
							/>
						</RNHostView>
					</Section>
				) : null}

				{description ? (
					<Section title="About">
						<Text>{description}</Text>
					</Section>
				) : null}

				{address ? (
					<Section title="Address">
						<AddressLink address={address} />
					</Section>
				) : null}

				<Section title="Accessibility">
					<Text>{accessibilityCopy(accessibility)}</Text>
				</Section>

				<LinkSection items={departments} title="Departments" />
				<LinkSection items={offices} title="Offices" />
				<LinkSection items={floors} title="Floors" />
			</List>
		</Host>
	)
}

function AddressLink({address}: {address: string}): React.ReactNode {
	// Linking rather than openUrl: maps.apple.com is a universal link that iOS
	// hands to Maps.app, and openUrl would offer to show it in the in-app
	// browser instead, which lands on Apple's web fallback page.
	let onPress = () => {
		let url = `https://maps.apple.com/?q=${encodeURIComponent(address)}`
		Linking.openURL(url).catch((err: unknown) => {
			console.warn(`could not open ${url}`, err)
		})
	}
	return (
		<Button
			modifiers={[accessibilityLabel(`Open ${address} in Maps`)]}
			onPress={onPress}
		>
			<Text>{address}</Text>
		</Button>
	)
}

function LinkSection({
	title,
	items,
}: {
	title: string
	// The server is not schema-validated at the boundary, so a record that
	// omits the field arrives as undefined rather than as an empty array.
	items: Array<LabelLinkString> | undefined
}): React.ReactNode {
	if (!items?.length) {
		return null
	}
	return (
		<Section title={title}>
			{items.map((raw) => {
				let {label, href} = parseLinkString(raw)
				if (!href) {
					return <Text key={raw}>{label}</Text>
				}
				return (
					<Button
						key={raw}
						modifiers={[accessibilityLabel(`Open ${label}`)]}
						onPress={() => openUrl(href)}
					>
						<Text>{label}</Text>
					</Button>
				)
			})}
		</Section>
	)
}

function accessibilityCopy(value: Building['accessibility']): string {
	switch (value) {
		case 'wheelchair':
			return 'Wheelchair-accessible.'
		case 'none':
			return 'Not wheelchair-accessible.'
		default:
			return 'Accessibility information not available.'
	}
}

const styles = StyleSheet.create({
	host: {flex: 1, backgroundColor: c.systemGroupedBackground},
	photo: {width: '100%', height: 180},
})
