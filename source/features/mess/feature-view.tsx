import * as React from 'react'
import {VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, lineSpacing, tint} from '@expo/ui/swift-ui/modifiers'
import {ImageView} from './image-view'
import {messRed} from './palette'
import {LINE_SPACING} from './poem-view'
import {SeriesRow} from './series-row'
import {BODY_ID, CAPTION, PhotoCaption, PROSE, SiteLinkCard, StoryBlocks} from './story-blocks'
import type {MessStory, StoryLayout} from './types'

/** A Photo post's words, set small and italic like a caption, so the pictures lead. */
const PHOTO_WORDS = [...CAPTION, tint(messRed), accessibilityIdentifier(BODY_ID)]
/** A short story's prose, with the poem page's line spacing. */
const STORY_PROSE = [...PROSE, lineSpacing(LINE_SPACING)]

type Props = {
	story: MessStory
	layout: Extract<StoryLayout, {kind: 'feature'}>
	columnWidth: number
}

/**
 * A Photo or Short Story post: its pictures, each framed with its caption under it and
 * opening the zoom viewer when tapped, then its words. A photo's words are set as a
 * caption; a short story's as prose opening in small caps, followed by the rest of its
 * series. Returned side by side, to land in the page's column.
 */
export function FeatureView({story, layout, columnWidth}: Props): React.ReactNode {
	// The two columns share a layout; the column says which one this is.
	let isShortStory = story.column === 'Short Story'
	// Some older Photo posts lost their picture and never had words.
	let isEmpty = layout.images.length === 0 && story.blocks.length === 0

	return (
		<>
			{layout.images.map((image, index) => (
				// oxlint-disable-next-line react/no-array-index-key -- a post's pictures are fixed, so their order is their identity
				<VStack alignment="leading" key={index} spacing={4}>
					<ImageView columnWidth={columnWidth} image={image} index={index} story={story} />
					<PhotoCaption caption={image.caption} />
				</VStack>
			))}
			<StoryBlocks
				columnWidth={columnWidth}
				opens={isShortStory}
				paragraph={isShortStory ? STORY_PROSE : PHOTO_WORDS}
				story={story}
			/>
			{isEmpty ? (
				<SiteLinkCard icon="safari" label="Read on olafmessenger.com" url={story.link} />
			) : null}
			{/* Every Microfiction Corner post carries the same banner, so its series is listed by title. */}
			{isShortStory ? <SeriesRow asTitles={true} story={story} /> : null}
		</>
	)
}
