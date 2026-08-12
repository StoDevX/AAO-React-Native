import * as React from 'react'
import {HStack, Image, List, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundColor,
	listStyle,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {Button} from '@expo/ui/swift-ui'
import * as c from '@frogpond/colors'
import type {Building, Feature} from './types'

type Props = {
	buildings: Array<Feature<Building>>
	onSelect: (id: string) => void
}

/// A SwiftUI List realises its rows lazily, but the elements handed to it are
/// built here on every render, so this is only reasonable while the collection
/// stays in the hundreds -- which Carleton's building set is. A collection
/// that could grow without bound wants a FlatList instead.
export function BuildingList({buildings, onSelect}: Props): React.ReactNode {
	return (
		<List modifiers={[listStyle('plain')]}>
			{buildings.map((building) => (
				<Row key={building.id} building={building} onSelect={onSelect} />
			))}
		</List>
	)
}

function Row({
	building,
	onSelect,
}: {
	building: Feature<Building>
	onSelect: (id: string) => void
}) {
	let {name, nickname} = building.properties

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(nickname ? `${name}, ${nickname}` : name),
			]}
			onPress={() => onSelect(building.id)}
		>
			{/* contentShape on the label, not the Button: SwiftUI derives the
			    tappable region from a button's label, so the whole row responds
			    rather than just the glyphs. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={[foregroundColor(c.label)]}>{name}</Text>
					{nickname ? (
						<Text
							modifiers={[
								font({textStyle: 'footnote'}),
								foregroundColor(c.secondaryLabel),
							]}
						>
							{nickname}
						</Text>
					) : null}
				</VStack>
				<Spacer />
				<Image color={c.tertiaryLabel} size={14} systemName="chevron.right" />
			</HStack>
		</Button>
	)
}
