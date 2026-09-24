import * as React from 'react'
import {Alert} from 'react-native'
import {Button, Section, SwipeActions, Text} from '@expo/ui/swift-ui'
import noop from 'lodash/noop'

import {ActionRow, DisclosureRow} from './rows'
import {MAX_ATTACHMENTS, type ImageAttachments} from './use-image-attachments'

/** The edge of an image's thumbnail, in points. */
const THUMBNAIL_SIZE = 44

type Props = {
	title: string
	attachments: ImageAttachments
}

/**
 * A form section for attaching photos to a problem report: a thumbnail row
 * per image, removed by swipe or by tap and confirm, and a row that opens the
 * photo library.
 */
export function ImageAttachmentsSection({title, attachments}: Props): React.ReactNode {
	let {images, picking, addImages, removeImage} = attachments

	let confirmRemoveImage = (uri: string) => {
		Alert.alert('Remove this image?', undefined, [
			{text: 'Cancel', style: 'cancel', onPress: noop},
			{text: 'Remove', style: 'destructive', onPress: () => removeImage(uri)},
		])
	}

	return (
		<Section
			footer={
				<Text>{`Screenshots or photos help show the problem. Up to ${MAX_ATTACHMENTS}.`}</Text>
			}
			title={title}
		>
			{/* Swipe actions per row rather than `List.ForEach`, whose `.onMove`
			    would offer to reorder images whose order means nothing. */}
			{images.map((image, index) => (
				<SwipeActions key={image.uri}>
					<DisclosureRow
						destination="action"
						detail="Tap to remove"
						image={{uri: image.uri, width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}}
						onPress={() => confirmRemoveImage(image.uri)}
						title={`Image ${index + 1}`}
					/>
					<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
						<Button
							label="Remove"
							onPress={() => removeImage(image.uri)}
							role="destructive"
							systemImage="trash"
						/>
					</SwipeActions.Actions>
				</SwipeActions>
			))}
			<ActionRow
				disabled={picking || images.length >= MAX_ATTACHMENTS}
				onPress={() => void addImages()}
				title={picking ? 'Adding Images…' : 'Add Image'}
			/>
		</Section>
	)
}
