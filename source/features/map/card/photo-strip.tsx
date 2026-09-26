import * as React from 'react'
import {Image as RNImage, Pressable, StyleSheet} from 'react-native'
import {RNHostView, Section, VStack} from '@expo/ui/swift-ui'
import {listRowBackground, listRowInsets, listRowSeparator} from '@expo/ui/swift-ui/modifiers'

import {buildingPhotoUrl} from '../urls'
import {CARD_INSET} from './card-style'
import {PhotoViewerModal} from './photo-viewer-modal'

/// Maps' photo tiles are square, with rounded corners.
const TILE = 170
const CORNER_RADIUS = 16

const ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 20, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/// A building's photo as a square tile, which opens full screen on a tap. The
/// feed holds one photo per building, so there is one tile and nothing swipes.
export function PhotoStrip({
	photos,
	name,
}: {
	photos: Array<string> | undefined
	name: string
}): React.ReactNode {
	let [viewing, setViewing] = React.useState(false)
	let photo = photos?.[0]
	if (!photo) {
		return null
	}
	let uri = buildingPhotoUrl(photo)
	let label = `Photo of ${name}`
	return (
		<Section>
			<VStack alignment="leading" modifiers={ROW}>
				{/* SwiftUI's Image reads a local file synchronously; these are
				    remote, so the React Native image loader does the work and
				    SwiftUI hosts the result. React Native takes the tap too. */}
				<RNHostView matchContents={true}>
					{/* The square is the Pressable's, so only the photo answers a
					    tap: the host stretches its child to the card's width. */}
					<Pressable
						accessibilityLabel={label}
						accessibilityRole="imagebutton"
						onPress={() => setViewing(true)}
						style={styles.tile}
						testID="card-photo"
					>
						<RNImage resizeMode="cover" source={{uri}} style={styles.photo} />
					</Pressable>
				</RNHostView>
				<PhotoViewerModal
					label={label}
					onClose={() => setViewing(false)}
					uri={uri}
					visible={viewing}
				/>
			</VStack>
		</Section>
	)
}

const styles = StyleSheet.create({
	tile: {width: TILE, height: TILE, borderRadius: CORNER_RADIUS, overflow: 'hidden'},
	photo: {width: '100%', height: '100%'},
})
