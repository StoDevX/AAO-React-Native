import * as React from 'react'
import {Button, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {PersonPhoto} from './person-photo'
import type {DirectoryItem} from './types'

type Props = {
	person: DirectoryItem
	/** The column width, in points, so a lone tile in a short row stays one column wide. */
	width: number
	/** Mirrors `TestIdentifiers.Directory.tilePrefix` so XCUITest can find a tile by position. */
	testID: string
	onPress: () => void
}

/**
 * One directory search result in the shape of a Phone.app favorite: a portrait
 * card carrying the person's photo (or their initials when the directory has no
 * image), with the name beneath. Tapping opens the person's detail screen.
 */
export function PersonTile({person, width, testID, onPress}: Props): React.ReactNode {
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(person.displayName),
				accessibilityIdentifier(testID),
			]}
			onPress={onPress}
		>
			<VStack modifiers={[frame({width}), contentShape(shapes.rectangle())]} spacing={8}>
				<PersonPhoto person={person} width={width} />

				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						foregroundStyle(c.secondaryLabel),
						multilineTextAlignment('center'),
						lineLimit(2),
						frame({width}),
					]}
				>
					{person.displayName}
				</Text>
			</VStack>
		</Button>
	)
}
