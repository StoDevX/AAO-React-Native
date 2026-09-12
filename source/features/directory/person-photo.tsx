import * as React from 'react'
import {Image as RNImage, StyleSheet} from 'react-native'
import {HStack, RoundedRectangle, RNHostView, Text, ZStack} from '@expo/ui/swift-ui'
import {clipShape, font, foregroundStyle, frame} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {initials} from './person'
import {photoHeight, TILE_RADIUS} from '../../components/tile-layout'
import type {DirectoryItem} from './types'

/** What drawing a person's photo needs of them: the picture, and a name to fall back on. */
export type PersonPhotoSubject = Pick<
	DirectoryItem,
	'displayName' | 'firstName' | 'lastName' | 'thumbnail'
>

type Props = {
	person: PersonPhotoSubject
	/** The photo's width in points. The height follows from the tile's aspect. */
	width: number
}

/**
 * A person's directory photo, at the tile's aspect and corner radius, with
 * their initials on a grey card when the directory has no picture of them.
 *
 * The search grid and the detail screen both draw the photo through this, so
 * the two show the same crop rather than two constants that have to agree.
 *
 * `thumbnail` rather than `photo`: the two are the same portrait, and the
 * full-size one is 205 KB against 33 KB for a box this small.
 */
export function PersonPhoto({person, width}: Props): React.ReactNode {
	let height = photoHeight(width)

	return (
		<ZStack modifiers={[frame({width, height}), clipShape('roundedRectangle', TILE_RADIUS)]}>
			{person.thumbnail ? (
				/* The frame belongs on the hosted view's SwiftUI parent and the
				   points on the image itself: a hosted view has no bounds of its
				   own, so neither alone gives the image a box to fill. */
				<HStack modifiers={[frame({width, height})]}>
					<RNHostView matchContents={false}>
						<RNImage
							accessibilityIgnoresInvertColors={true}
							source={{uri: person.thumbnail}}
							style={[styles.photo, {width, height}]}
						/>
					</RNHostView>
				</HStack>
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
	)
}

const styles = StyleSheet.create({
	photo: {resizeMode: 'cover'},
})
