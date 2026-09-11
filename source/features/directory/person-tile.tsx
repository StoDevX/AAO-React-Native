import * as React from 'react'
import {Image, StyleSheet} from 'react-native'
import {Button, RoundedRectangle, RNHostView, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	aspectRatio,
	buttonStyle,
	clipShape,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {initials} from './person'
import {TILE_ASPECT, TILE_RADIUS} from '../../components/tile-layout'
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
	let photo = person.photo || person.thumbnail

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
				<ZStack
					modifiers={[
						frame({width}),
						aspectRatio({ratio: TILE_ASPECT, contentMode: 'fit'}),
						clipShape('roundedRectangle', TILE_RADIUS),
					]}
				>
					{photo ? (
						<RNHostView matchContents={false}>
							<Image
								accessibilityIgnoresInvertColors={true}
								source={{uri: photo}}
								style={styles.photo}
							/>
						</RNHostView>
					) : (
						<>
							<RoundedRectangle
								cornerRadius={TILE_RADIUS}
								modifiers={[foregroundStyle(c.systemGray)]}
							/>
							<Text modifiers={[font({textStyle: 'largeTitle'}), foregroundStyle(c.white)]}>
								{initials(person)}
							</Text>
						</>
					)}
				</ZStack>

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

const styles = StyleSheet.create({
	photo: {width: '100%', height: '100%', resizeMode: 'cover'},
})
