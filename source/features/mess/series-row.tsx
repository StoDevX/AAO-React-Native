import * as React from 'react'
import {useRouter} from 'expo-router'
import {
	Button,
	HStack,
	LazyHStack,
	Rectangle,
	ScrollView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
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
import {RowAccessory} from '../../components/rows'
import {FramedPhoto} from './image-view'
import {TAP_TARGET} from './lib/glyph-grid'
import {faded, ink} from './palette'
import {messSeriesOptions} from './query'
import {SECTION_HEADING} from './story-blocks'
import type {MessStory, Photo} from './types'

/** A thumbnail's side, in points. */
const THUMBNAIL = 120
/** One id for every story in the row, thumbnail or title: a UI test opens the first, whichever story it is. */
const SERIES_STORY_ID = 'mess-series-story'

const TITLE = [
	font({textStyle: 'footnote', design: 'serif'}),
	foregroundStyle(ink),
	lineLimit(2),
	frame({width: THUMBNAIL, alignment: 'leading'}),
]
const THUMBNAIL_BUTTON = [
	buttonStyle('plain'),
	contentShape(shapes.rectangle()),
	accessibilityIdentifier(SERIES_STORY_ID),
]
/** Where a story has no picture, a blank of the same size keeps the row even. */
const BLANK = [foregroundStyle(faded), opacity(0.2), frame({width: THUMBNAIL, height: THUMBNAIL})]
/** A title row takes a tap across its whole width, and is never shorter than a comfortable target. */
const TITLE_ROW = [frame({minHeight: TAP_TARGET}), contentShape(shapes.rectangle())]
const ROW_TITLE = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink)]

/** The picture a story shows in the row: its comic or artwork, else its lead photo. */
function pictureOf(story: MessStory): Photo | null {
	return story.layout.kind === 'image' ? story.layout.image : story.photo
}

type Props = {
	story: MessStory
	/** Lists the stories as title rows rather than thumbnails, for a series whose pictures all look alike */
	asTitles?: boolean
}

/**
 * Other stories to read after this one, such as the rest of a comic's series: a sideways row
 * of thumbnails, or a list of titles. Shows nothing while they load, when they fail to, or
 * when there are none.
 */
export function SeriesRow({story, asTitles = false}: Props): React.ReactNode {
	let router = useRouter()
	// Names this row as the opener of the stories it opens; no other screen's row shares it.
	let opener = React.useId()
	let {data} = useQuery(messSeriesOptions(story))
	if (!data || data.stories.length === 0) return null

	let open = (other: MessStory) =>
		router.navigate({
			pathname: '/Messenger/story',
			params: {id: String(other.id), from: opener},
		})

	return (
		<VStack alignment="leading" spacing={8}>
			<Text modifiers={SECTION_HEADING}>{data.title}</Text>
			{asTitles ? (
				<VStack alignment="leading" spacing={0}>
					{data.stories.map((other) => (
						<Button
							key={other.id}
							modifiers={[
								buttonStyle('plain'),
								accessibilityLabel(other.title),
								accessibilityIdentifier(SERIES_STORY_ID),
							]}
							onPress={() => open(other)}
						>
							{/* contentShape on the label, not the Button -- see NavigationRow in
							    components/rows.tsx. */}
							<HStack modifiers={TITLE_ROW} spacing={12}>
								<Text modifiers={ROW_TITLE}>{other.title}</Text>
								<Spacer />
								<RowAccessory destination="push" />
							</HStack>
						</Button>
					))}
				</VStack>
			) : (
				<ScrollView axes="horizontal" showsIndicators={false}>
					<LazyHStack alignment="top" spacing={12}>
						{data.stories.map((other) => {
							let picture = pictureOf(other)
							return (
								<Button key={other.id} modifiers={THUMBNAIL_BUTTON} onPress={() => open(other)}>
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
			)}
		</VStack>
	)
}
