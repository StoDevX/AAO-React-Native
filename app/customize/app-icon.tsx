import * as React from 'react'
import {Image as RNImage, StyleSheet, View, useColorScheme, useWindowDimensions} from 'react-native'
import {
	Button,
	Form,
	Grid,
	HStack,
	Host,
	RNHostView,
	Section,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	frame,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'

import {type AppIconName, previewsFor} from '../../images/icons'
import {type IconEntry, galleryColumns, iconsByGroup} from '../../source/features/customize/icons'
import {useAppIcon} from '../../source/features/customize/use-app-icon'

/// Three tiles fit across an iPhone 17e's inset section with room for captions.
const TILE = 76
/// The ring around the current icon, and the gap between it and the artwork.
const RING_WIDTH = 2.5
const RING_GAP = 2
const RING_INSET = RING_WIDTH + RING_GAP
const FRAMED = TILE + RING_INSET * 2
/// Apple's icon squircle ratio; see images/icons.
const ICON_RADIUS_RATIO = 0.238

const styles = StyleSheet.create({
	// Pushed inside the Customize sheet, which paints no background of its own.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
	icon: {
		width: TILE,
		height: TILE,
		borderRadius: TILE * ICON_RADIUS_RATIO,
	},
	// Every tile keeps the ring's room, so marking one does not shift the grid.
	ring: {
		width: FRAMED,
		height: FRAMED,
		padding: RING_GAP,
		borderWidth: RING_WIDTH,
		borderColor: 'transparent',
		borderRadius: TILE * ICON_RADIUS_RATIO + RING_INSET,
	},
	ringCurrent: {
		borderColor: c.systemBlue,
	},
})

export default function AppIconPage(): React.ReactNode {
	let {current, apply} = useAppIcon()

	return (
		<>
			<Stack.Title>App Icon</Stack.Title>
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-app-icon')]}>
				<Form>
					{iconsByGroup().map(({group, icons}) => (
						<Section key={group} title={group}>
							<IconGrid current={current.type} icons={icons} onChoose={apply} />
						</Section>
					))}
				</Form>
			</Host>
		</>
	)
}

/** Splits `items` into rows of `size`. */
function rowsOf<T>(items: ReadonlyArray<T>, size: number): Array<Array<T>> {
	let rows: Array<Array<T>> = []
	for (let start = 0; start < items.length; start += size) {
		rows.push(items.slice(start, start + size))
	}
	return rows
}

type IconGridProps = {
	current: AppIconName
	icons: ReadonlyArray<IconEntry>
	onChoose: (type: AppIconName) => void
}

const IconGrid = React.memo(function IconGrid({
	current,
	icons,
	onChoose,
}: IconGridProps): React.ReactNode {
	let {fontScale} = useWindowDimensions()

	return (
		<Grid alignment="top" horizontalSpacing={12} verticalSpacing={16}>
			{rowsOf(icons, galleryColumns(fontScale)).map((row) => (
				<Grid.Row key={row[0].type}>
					{row.map((icon) => (
						<IconTile
							key={icon.type}
							icon={icon}
							isCurrent={icon.type === current}
							onChoose={onChoose}
						/>
					))}
				</Grid.Row>
			))}
		</Grid>
	)
})

type IconTileProps = {
	icon: IconEntry
	isCurrent: boolean
	onChoose: (type: AppIconName) => void
}

function IconTile({icon, isCurrent, onChoose}: IconTileProps): React.ReactNode {
	let scheme = useColorScheme()

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(icon.title),
				...(isCurrent ? [accessibilityAddTraits(['isSelected'])] : []),
			]}
			onPress={() => onChoose(icon.type)}
		>
			{/* Each tile takes an equal share of the row, so the columns span the
			    section; contentShape makes the whole share tappable, not only the
			    icon and caption. */}
			<VStack
				modifiers={[frame({maxWidth: Infinity}), contentShape(shapes.rectangle())]}
				spacing={6}
			>
				<HStack modifiers={[frame({width: FRAMED, height: FRAMED})]}>
					<RNHostView matchContents={false}>
						<View style={[styles.ring, isCurrent && styles.ringCurrent]}>
							<RNImage
								accessibilityIgnoresInvertColors={true}
								source={previewsFor(icon.type, scheme).logo}
								style={styles.icon}
							/>
						</View>
					</RNHostView>
				</HStack>
				<Text modifiers={[font({textStyle: 'caption'}), multilineTextAlignment('center')]}>
					{icon.title}
				</Text>
			</VStack>
		</Button>
	)
}
