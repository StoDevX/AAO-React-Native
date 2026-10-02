import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ZoomImageViewer} from '../../components/zoom-image-viewer'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {imageLabel, photoLabel, picturePlace} from './lib/byline'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStory} from './use-mess-story'
import type {MessStory} from './types'

/** A picture to show, and what VoiceOver reads for it. */
type Picture = {url: string; label: string}

/**
 * The picture the viewer shows. Given an address, the story's lead photo or the figure in its
 * body at that address; an address that is not one of the story's shows nothing, so a link
 * cannot put any image on the web in the viewer. Otherwise a comic's or artwork's one picture,
 * or the feature page's picture at `index`. Null when the story has no picture there.
 */
function pictureOf(
	story: MessStory | undefined,
	index: number,
	url: string | undefined,
): Picture | null {
	if (!story) return null
	if (url !== undefined) {
		let photos = [
			story.photo,
			...story.blocks.map((block) => (block.type === 'figure' ? block : null)),
		]
		let photo = photos.find((candidate) => candidate?.url === url)
		return photo ? {url: photo.url, label: photoLabel(story, photo.caption)} : null
	}
	let label = imageLabel(story, picturePlace(story, index))
	if (story.layout.kind === 'image') return {url: story.layout.image.url, label}
	if (story.layout.kind === 'feature') {
		let image = story.layout.images[index]
		return image ? {url: image.url, label} : null
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
	let image = pictureOf(query.data, index, url)

	return (
		<ZoomImageViewer
			closeTestID="mess-image-viewer-close"
			image={
				image
					? {uri: image.url, accessibilityLabel: image.label, testID: 'mess-image-viewer-image'}
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
