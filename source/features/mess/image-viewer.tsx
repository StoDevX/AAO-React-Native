import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ZoomImageViewer} from '../../components/zoom-image-viewer'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {imageLabel} from './lib/byline'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStory} from './use-mess-story'

type Props = {id: number}

/** A comic or piece of artwork on its own, on black, to pinch or double-tap to zoom. */
export function ImageViewer({id}: Props): React.ReactNode {
	let close = useDismissOnce()
	let query = useMessStory(id)
	let story = query.data
	let image = story?.layout.kind === 'image' ? story.layout.image : null

	return (
		<ZoomImageViewer
			closeTestID="mess-image-viewer-close"
			image={
				image && story
					? {
							uri: image.url,
							accessibilityLabel: imageLabel(story),
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
