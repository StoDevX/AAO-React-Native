import * as React from 'react'
import {
	Image,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'

import {parseLinkString} from './lib/parse-link-string'
import type {Building, Feature, LabelLinkString} from './types'

/// The smallest square Apple's Human Interface Guidelines will accept, and
/// what CLAUDE.md requires of every interactive element here.
const MIN_TOUCH_TARGET = 44

type Props = {
	building: Feature<Building> | undefined
	onClose: () => void
}

export function BuildingInfo({building, onClose}: Props): React.ReactNode {
	if (!building) {
		return (
			<View style={styles.container}>
				<NoticeView text="Building not found." />
				<TouchableOpacity
					accessibilityLabel="Close"
					accessibilityRole="button"
					onPress={onClose}
					style={styles.closeButton}
				>
					<Text style={styles.closeText}>Close</Text>
				</TouchableOpacity>
			</View>
		)
	}

	let {
		accessibility,
		address,
		departments,
		description,
		floors,
		name,
		offices,
		photos,
	} = building.properties

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior="automatic"
			style={styles.container}
		>
			<Header building={building} onClose={onClose} />
			{photos?.[0] ? (
				<Image
					accessibilityLabel={`Photo of ${name}`}
					source={{uri: photos[0]}}
					style={styles.photo}
				/>
			) : null}
			{description ? (
				<Section title="About">
					<Text style={styles.body}>{description}</Text>
				</Section>
			) : null}
			{address ? (
				<Section title="Address">
					<AddressLink address={address} />
				</Section>
			) : null}
			<Section title="Accessibility">
				<Text style={styles.body}>{accessibilityCopy(accessibility)}</Text>
			</Section>
			<LinkSection items={departments} title="Departments" />
			<LinkSection items={offices} title="Offices" />
			<LinkSection items={floors} title="Floors" />
		</ScrollView>
	)
}

function Header({
	building,
	onClose,
}: {
	building: Feature<Building>
	onClose: () => void
}) {
	let {name, nickname} = building.properties
	return (
		<View style={styles.header}>
			<View style={styles.headerText}>
				<Text style={styles.title}>{name}</Text>
				{nickname ? <Text style={styles.subtitle}>{nickname}</Text> : null}
			</View>
			<TouchableOpacity
				accessibilityLabel="Close"
				accessibilityRole="button"
				onPress={onClose}
				style={styles.closeButton}
			>
				<Text style={styles.closeText}>Close</Text>
			</TouchableOpacity>
		</View>
	)
}

function Section({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{children}
		</View>
	)
}

function AddressLink({address}: {address: string}) {
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
		<TouchableOpacity
			accessibilityLabel={`Open ${address} in Maps`}
			accessibilityRole="link"
			onPress={onPress}
		>
			<Text style={styles.link}>{address}</Text>
		</TouchableOpacity>
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
					return (
						<Text key={raw} style={styles.body}>
							{label}
						</Text>
					)
				}
				return (
					<TouchableOpacity
						key={raw}
						accessibilityLabel={`Open ${label}`}
						accessibilityRole="link"
						onPress={() => openUrl(href)}
					>
						<Text style={styles.link}>{label}</Text>
					</TouchableOpacity>
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
	container: {flex: 1, backgroundColor: c.systemGroupedBackground},
	content: {paddingBottom: 24},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	headerText: {flex: 1},
	title: {fontSize: 22, fontWeight: '700', color: c.label},
	subtitle: {fontSize: 15, color: c.secondaryLabel, marginTop: 2},
	/// 44pt tall around a 15pt line, which is the minimum touch target.
	closeButton: {
		paddingHorizontal: 20,
		minHeight: MIN_TOUCH_TARGET,
		justifyContent: 'center',
	},
	closeText: {color: c.systemBlue, fontSize: 15, fontWeight: '600'},
	photo: {width: '100%', height: 180, marginBottom: 12},
	section: {paddingHorizontal: 16, paddingVertical: 8},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: c.secondaryLabel,
		textTransform: 'uppercase',
		marginBottom: 4,
	},
	body: {fontSize: 15, color: c.label, lineHeight: 20},
	link: {fontSize: 15, color: c.systemBlue, lineHeight: 22},
})
