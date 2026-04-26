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
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

import {parseLinkString} from './lib/parse-link-string'
import {useMapData} from './query'
import {useMapSelection} from './selection-context'
import type {Building, Feature, LabelLinkString} from './types'

type RouteParams = {MapBuildingInfo: {buildingId: string}}

export function BuildingInfo(): React.ReactNode {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	let navigation = useNavigation<any>()
	let route = useRoute<RouteProp<RouteParams, 'MapBuildingInfo'>>()
	let {selectedBuildingId, clearSelection} = useMapSelection()
	let {data: buildings = []} = useMapData()

	let id = selectedBuildingId ?? route.params?.buildingId ?? null
	let building = React.useMemo(
		() => buildings.find((b) => b.id === id),
		[buildings, id],
	)

	let handleClose = React.useCallback(() => {
		clearSelection()
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		navigation.goBack()
	}, [clearSelection, navigation])

	if (!building) {
		return (
			<View style={styles.container}>
				<NoticeView text="Building not found." />
				<TouchableOpacity
					accessibilityRole="button"
					onPress={handleClose}
					style={styles.closeButton}
				>
					<Text style={styles.closeText}>Close</Text>
				</TouchableOpacity>
			</View>
		)
	}

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior="automatic"
			style={styles.container}
		>
			<Header building={building} onClose={handleClose} />
			{building.properties.photos?.[0] ? (
				<Image
					accessibilityLabel={`Photo of ${building.properties.name}`}
					source={{uri: building.properties.photos[0]}}
					style={styles.photo}
				/>
			) : null}
			{building.properties.description ? (
				<Section title="About">
					<Text style={styles.body}>{building.properties.description}</Text>
				</Section>
			) : null}
			{building.properties.address ? (
				<Section title="Address">
					<AddressLink address={building.properties.address} />
				</Section>
			) : null}
			<Section title="Accessibility">
				<Text style={styles.body}>
					{accessibilityCopy(building.properties.accessibility)}
				</Text>
			</Section>
			<LinkSection
				items={building.properties.departments}
				title="Departments"
			/>
			<LinkSection items={building.properties.offices} title="Offices" />
			<LinkSection items={building.properties.floors} title="Floors" />
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
	let onPress = () => {
		let url = `http://maps.apple.com/?q=${encodeURIComponent(address)}`
		Linking.openURL(url)
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
	items: Array<LabelLinkString>
}) {
	if (items.length === 0) {
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
						accessibilityRole="link"
						onPress={() => Linking.openURL(href)}
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
	closeButton: {paddingHorizontal: 20, paddingVertical: 12},
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
