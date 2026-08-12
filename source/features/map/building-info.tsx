import * as React from 'react'
import {Image as RNImage, StyleSheet} from 'react-native'
import {
	Button,
	ContentUnavailableView,
	Form,
	HStack,
	Host,
	LabeledContent,
	Link,
	RNHostView,
	Section,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	contentShape,
	font,
	foregroundColor,
	listRowInsets,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

import {parseLinkString} from './lib/parse-link-string'
import type {Building, Feature, LabelLinkString} from './types'

const PHOTO_HEIGHT = 180
const ZERO_INSETS = {top: 0, leading: 0, bottom: 0, trailing: 0}

type Props = {
	building: Feature<Building> | undefined
}

export function BuildingInfo({building}: Props): React.ReactNode {
	if (!building) {
		return (
			<Host style={styles.host}>
				<ContentUnavailableView
					description="It may have been renamed, or removed from the campus data."
					systemImage="mappin.slash"
					title="Building not found"
				/>
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
			<Form>
				{photos?.[0] ? (
					// The one view that cannot be SwiftUI: @expo/ui's Image takes SF
					// Symbols or a local file URI (which it reads synchronously, on
					// the main thread), so a remote photo needs React Native's.
					<VStack modifiers={[listRowInsets(ZERO_INSETS)]}>
						<RNHostView matchContents={true}>
							<RNImage
								accessibilityLabel={`Photo of ${name}`}
								source={{uri: photos[0]}}
								style={styles.photo}
							/>
						</RNHostView>
					</VStack>
				) : null}

				{nickname ? (
					<Section>
						<Text
							modifiers={[
								font({textStyle: 'subheadline'}),
								foregroundColor(c.secondaryLabel),
							]}
						>
							{nickname}
						</Text>
					</Section>
				) : null}

				{description ? (
					<Section title="About">
						<Text>{description}</Text>
					</Section>
				) : null}

				{address ? (
					<Section title="Address">
						{/* A SwiftUI Link rather than a Button: maps.apple.com is a
						    universal link, so the system hands it to Maps. */}
						<Link
							destination={`https://maps.apple.com/?q=${encodeURIComponent(address)}`}
							label={address}
						/>
					</Section>
				) : null}

				<Section title="Accessibility">
					<LabeledContent label="Wheelchair access">
						<Text>{accessibilityCopy(accessibility)}</Text>
					</LabeledContent>
				</Section>

				<LinkSection items={departments} title="Departments" />
				<LinkSection items={offices} title="Offices" />
				<LinkSection items={floors} title="Floors" />
			</Form>
		</Host>
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
}) {
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

				// A Button calling openUrl, not a SwiftUI Link: openUrl honours
				// the in-app-browser preference from Settings, and a Link would
				// always leave for Safari.
				return (
					<Button
						key={raw}
						modifiers={[buttonStyle('plain')]}
						onPress={() => openUrl(href)}
					>
						<HStack modifiers={[contentShape(shapes.rectangle())]}>
							<Text modifiers={[foregroundColor(c.systemBlue)]}>{label}</Text>
							<Spacer />
						</HStack>
					</Button>
				)
			})}
		</Section>
	)
}

function accessibilityCopy(value: Building['accessibility']): string {
	switch (value) {
		case 'wheelchair':
			return 'Accessible'
		case 'none':
			return 'Not accessible'
		default:
			return 'Unknown'
	}
}

const styles = StyleSheet.create({
	host: {flex: 1},
	photo: {width: '100%', height: PHOTO_HEIGHT},
})
