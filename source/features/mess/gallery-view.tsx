import * as React from 'react'
import {HStack, Spacer, TabView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityHidden,
	font,
	foregroundStyle,
	frame,
	tabViewStyle,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {ViewerButton} from './image-view'
import {galleryPhotoLabel} from './lib/byline'
import {galleryPageHeight, photoFit, shownPhotos} from './lib/gallery'
import {faded} from './palette'
import {messGalleryOptions} from './query'
import {RemotePhoto} from './remote-photo'
import {PHOTO_ID, PhotoCaption} from './story-blocks'
import type {Block, MessStory} from './types'

/** The count VoiceOver hears in the photo's own label. */
const COUNT = [font({textStyle: 'caption'}), foregroundStyle(faded), accessibilityHidden(true)]

type Props = {
	story: MessStory
	gallery: Extract<Block, {type: 'gallery'}>
	columnWidth: number
}

/**
 * An SNO slideshow as a pager: one photo at a time, swiped sideways, each opening the zoom
 * viewer, with the photographer's credit and the count under it. Until the photos load, or
 * when they cannot, it shows the one the slideshow's HTML carries; with neither, nothing.
 */
export function GalleryView({story, gallery, columnWidth}: Props): React.ReactNode {
	let {credit} = gallery
	let query = useQuery(messGalleryOptions(gallery.photoIds))
	let [shown, setShown] = React.useState(0)

	let photos = shownPhotos(gallery, query.data)
	if (photos.length === 0) return null
	let pageHeight = galleryPageHeight(photos, columnWidth)
	let caption = photos[shown]?.caption ?? ''

	return (
		<VStack alignment="leading" spacing={4}>
			<TabView
				defaultSelection="0"
				modifiers={[
					tabViewStyle({type: 'page', indexDisplayMode: 'never'}),
					frame({width: columnWidth, height: pageHeight}),
				]}
				onSelectionChange={(value) => setShown(Number(value))}
			>
				{photos.map((photo, index) => {
					let size = photoFit(photo, columnWidth, pageHeight)
					let place = {index, count: photos.length}
					return (
						<TabView.Tab key={photo.url} value={String(index)}>
							<ViewerButton
								identifier={PHOTO_ID}
								label={galleryPhotoLabel(story, credit, place)}
								params={{id: String(story.id), url: photo.url}}
							>
								<RemotePhoto height={size.height} url={photo.url} width={size.width} />
							</ViewerButton>
						</TabView.Tab>
					)
				})}
			</TabView>
			<PhotoCaption caption={caption} />
			<HStack alignment="firstTextBaseline">
				{/* The photo's button already names the photographer and its place in the set. */}
				<PhotoCaption caption={credit} readByPhoto={true} />
				<Spacer />
				{photos.length > 1 ? (
					<Text modifiers={COUNT}>{`${shown + 1} of ${photos.length}`}</Text>
				) : null}
			</HStack>
		</VStack>
	)
}
