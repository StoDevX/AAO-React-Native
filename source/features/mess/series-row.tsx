import * as React from 'react'
import {useRouter} from 'expo-router'
import {Button, LazyHStack, Rectangle, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	opacity,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {FramedPhoto} from './image-view'
import {faded, ink} from './palette'
import {messSeriesOptions} from './query'
import type {MessStory, Photo} from './types'

/** A thumbnail's side, in points. */
const THUMBNAIL = 120

const HEADING = [
	font({textStyle: 'headline', design: 'serif', smallCaps: true}),
	foregroundStyle(ink),
	accessibilityAddTraits(['isHeader']),
]
const TITLE = [
	font({textStyle: 'footnote', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(2),
	frame({width: THUMBNAIL, alignment: 'leading'}),
]
const THUMBNAIL_BUTTON = [
	buttonStyle('plain'),
	contentShape(shapes.rectangle()),
	// One id for every thumbnail: a UI test opens the first, whichever story it is.
	accessibilityIdentifier('mess-series-story'),
]
/** Where a story has no picture, a blank of the same size keeps the row even. */
const BLANK = [foregroundStyle(faded), opacity(0.2), frame({width: THUMBNAIL, height: THUMBNAIL})]

/** The picture a story shows in the row: its comic or artwork, else its lead photo. */
function pictureOf(story: MessStory): Photo | null {
	return story.layout.kind === 'image' ? story.layout.image : story.photo
}

type Props = {story: MessStory}

/**
 * Other stories to read after this one, such as the rest of a comic's series, as a sideways
 * row of thumbnails. Shows nothing while they load, when they fail to, or when there are none.
 */
export function SeriesRow({story}: Props): React.ReactNode {
	let router = useRouter()
	let {data} = useQuery(messSeriesOptions(story))
	if (!data || data.stories.length === 0) return null

	return (
		<VStack alignment="leading" spacing={8}>
			<Text modifiers={HEADING}>{data.title}</Text>
			<ScrollView axes="horizontal" showsIndicators={false}>
				<LazyHStack alignment="top" spacing={12}>
					{data.stories.map((other) => {
						let picture = pictureOf(other)
						return (
							<Button
								key={other.id}
								modifiers={THUMBNAIL_BUTTON}
								onPress={() =>
									router.navigate({pathname: '/Messenger/story', params: {id: String(other.id)}})
								}
							>
								<VStack alignment="leading" spacing={6}>
									{picture ? (
										<FramedPhoto height={THUMBNAIL} url={picture.url} width={THUMBNAIL} />
									) : (
										<Rectangle modifiers={BLANK} />
									)}
									<Text modifiers={TITLE}>{other.title}</Text>
								</VStack>
							</Button>
						)
					})}
				</LazyHStack>
			</ScrollView>
		</VStack>
	)
}
