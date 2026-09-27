import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ZoomImageViewer} from '../../components/zoom-image-viewer'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {imageLabel, picturePlace} from './lib/byline'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStory} from './use-mess-story'
import type {MessStory, Photo} from './types'

/**
 * The picture the viewer shows: a comic's or artwork's one picture, or the feature page's
 * picture at `index`. Null when the story has no picture there.
 */
function pictureOf(story: MessStory | undefined, index: number): Photo | null {
	if (story?.layout.kind === 'image') return story.layout.image
	if (story?.layout.kind === 'feature') return story.layout.images[index] ?? null
	return null
}

type Props = {
	id: number
	/** Which of a feature page's pictures to show; a comic or artwork has only the one */
	index?: number
}

/** A comic, a piece of artwork or a feature page's picture on its own, on black, to pinch or double-tap to zoom. */
export function ImageViewer({id, index = 0}: Props): React.ReactNode {
	let close = useDismissOnce()
	let query = useMessStory(id)
	let story = query.data
	let image = pictureOf(story, index)

	return (
		<ZoomImageViewer
			closeTestID="mess-image-viewer-close"
			image={
				image && story
					? {
							uri: image.url,
							accessibilityLabel: imageLabel(story, picturePlace(story, index)),
							testID: 'mess-image-viewer-image',
						}
					: null
			}
			onClose={close}
			placeholder={
				<StoryLookupNotice
					query={query}
					style={styles.notice}
					textStyle={styles.noticeText}
					unavailableText="Image unavailable"
				/>
			}
		/>
	)
}

const styles = StyleSheet.create({
	notice: {backgroundColor: 'black'},
	noticeText: {color: 'white'},
})
