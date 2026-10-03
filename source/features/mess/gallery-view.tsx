import * as React from 'react'
import {VStack} from '@expo/ui/swift-ui'
import {ViewerButton} from './image-view'
import {galleryPhotoLabel} from './lib/byline'
import {RemotePhoto} from './remote-photo'
import {PHOTO_ID, PhotoCaption} from './story-blocks'
import type {Block, MessStory} from './types'

type Props = {
	story: MessStory
	gallery: Extract<Block, {type: 'gallery'}>
	columnWidth: number
}

/**
 * An SNO slideshow: its first photo at the column's width, which opens the zoom viewer, with
 * the photographer's credit under it. Nothing when the slideshow's HTML gave no photo to show.
 */
export function GalleryView({story, gallery, columnWidth}: Props): React.ReactNode {
	let {cover, credit, photoIds} = gallery
	if (!cover) return null
	let height = Math.round((columnWidth * cover.height) / cover.width)
	return (
		<VStack alignment="leading" spacing={4}>
			<ViewerButton
				identifier={PHOTO_ID}
				label={galleryPhotoLabel(story, credit, {index: 0, count: photoIds.length})}
				params={{id: String(story.id), url: cover.url}}
			>
				<RemotePhoto height={height} url={cover.url} width={columnWidth} />
			</ViewerButton>
			{/* The button's label already names the photographer. */}
			<PhotoCaption caption={credit} readByPhoto={true} />
		</VStack>
	)
}
