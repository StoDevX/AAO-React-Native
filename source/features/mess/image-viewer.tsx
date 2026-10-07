import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useQueries} from '@tanstack/react-query'
import {ZoomImageViewer} from '../../components/zoom-image-viewer'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {shownCaption} from './lib/alt'
import {galleryPhotoLabel, imageLabel, photoLabel, picturePlace} from './lib/byline'
import {shownPhotos} from './lib/gallery'
import {messGalleryOptions} from './query'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStory} from './use-mess-story'
import type {Block, CaptionedPhoto, MessStory} from './types'

/** A picture to show, what VoiceOver reads for it, and the caption drawn over it; empty when it has none. */
type Picture = {url: string; label: string; caption: string}

type Gallery = Extract<Block, {type: 'gallery'}>

/** The gallery photo the story's page draws at `url`, named as its page names it; null when none. */
function galleryPictureAt(
	story: MessStory,
	galleries: Array<{gallery: Gallery; photos: CaptionedPhoto[]}>,
	url: string,
): Picture | null {
	for (let {gallery, photos} of galleries) {
		let index = photos.findIndex((photo) => photo.url === url)
		let photo = photos[index]
		if (!photo) continue
		let label = galleryPhotoLabel(story, gallery.credit, {index, count: photos.length})
		return {url: photo.largeUrl ?? photo.url, label, caption: shownCaption(photo)}
	}
	return null
}

/**
 * The picture the viewer shows. Given an address, the story's lead photo, the figure in its
 * body or the gallery photo that the article draws at that address, shown at the largest
 * copy it has; an address that is not one of the story's shows nothing, so a link cannot put any
 * image on the web in the viewer. Otherwise a comic's or artwork's one picture, or the
 * feature page's picture at `index`, also at its largest copy. Null when the story has no
 * picture there.
 */
function pictureOf(
	story: MessStory | undefined,
	index: number,
	url: string | undefined,
	galleries: Array<{gallery: Gallery; photos: CaptionedPhoto[]}>,
): Picture | null {
	if (!story) return null
	if (url !== undefined) {
		let figures = story.blocks.flatMap((block) => (block.type === 'figure' ? [block] : []))
		let photos: Array<CaptionedPhoto | null> = [story.photo, ...figures]
		let photo = photos.find((candidate) => candidate?.url === url)
		if (photo) {
			return {
				url: photo.largeUrl ?? photo.url,
				label: photoLabel(story, photo.caption),
				caption: shownCaption(photo),
			}
		}
		return galleryPictureAt(story, galleries, url)
	}
	let label = imageLabel(story, picturePlace(story, index))
	if (story.layout.kind === 'image') {
		let {image} = story.layout
		return {url: image.largeUrl ?? image.url, label, caption: shownCaption(image)}
	}
	if (story.layout.kind === 'feature') {
		let image = story.layout.images[index]
		if (!image) return null
		return {url: image.largeUrl ?? image.url, label, caption: shownCaption(image)}
	}
	return null
}

type Props = {
	id: number
	/** Which of a feature page's pictures to show; a comic or artwork has only the one */
	index?: number
	/** The address of the lead photo or body figure to show, which takes the place of `index` */
	url?: string
}

/** A comic, a piece of artwork, a feature page's picture or a story's photo on its own, on black, to pinch or double-tap to zoom. */
export function ImageViewer({id, index = 0, url}: Props): React.ReactNode {
	let close = useDismissOnce()
	let query = useMessStory(id)
	let galleries = (query.data?.blocks ?? []).filter(
		(block): block is Gallery => block.type === 'gallery',
	)
	// The page fetched these to draw them, so the viewer finds them already in the cache.
	let fetched = useQueries({
		queries: galleries.map((gallery) => messGalleryOptions(gallery.photoIds)),
	})
	let shown = galleries.map((gallery, n) => ({
		gallery,
		photos: shownPhotos(gallery, fetched[n]?.data),
	}))
	let image = pictureOf(query.data, index, url, shown)

	return (
		<ZoomImageViewer
			closeTestID="mess-image-viewer-close"
			image={
				image
					? {
							uri: image.url,
							accessibilityLabel: image.label,
							caption: image.caption,
							testID: 'mess-image-viewer-image',
						}
					: null
			}
			onClose={close}
			shareTestID="mess-image-viewer-share"
			placeholder={
				<StoryLookupNotice
					query={query}
					colorScheme="dark"
					style={styles.notice}
					unavailableText="Image Unavailable"
				/>
			}
		/>
	)
}

const styles = StyleSheet.create({
	notice: {backgroundColor: 'black'},
})
