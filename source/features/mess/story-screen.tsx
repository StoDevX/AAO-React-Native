import * as React from 'react'
import {Linking, Share, StyleSheet, useWindowDimensions} from 'react-native'
import {Stack} from 'expo-router'
import {Divider, Host, LazyVStack, ScrollView, useNativeState, VStack} from '@expo/ui/swift-ui'
import {background, padding, scrollPosition, scrollTargetLayout} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {openURLAction} from '../../lib/open-url-action'
import {AuthorCard} from './author-card'
import {HoroscopesView} from './horoscopes-view'
import {ImageView} from './image-view'
import {paper} from './palette'
import {PoemView} from './poem-view'
import {QuietHeader} from './quiet-header'
import {SeriesRow} from './series-row'
import {SiteLinkCard, StoryBlock} from './story-blocks'
import {StoryHeader} from './story-header'
import {StoryLookupNotice} from './story-lookup-notice'
import type {MessStory} from './types'
import {useMessStory} from './use-mess-story'

const COLUMN_MARGIN = 20
/** A poem's wider margins, which give its lines more air. */
const POEM_MARGIN = 28
/** The paper, and a link in the story's text opening where the reader's link setting says. */
const PAGE = [background(paper), openURLAction(openUrl)]
const COLUMN = [padding({horizontal: COLUMN_MARGIN, vertical: 16})]
const POEM_COLUMN = [padding({horizontal: POEM_MARGIN, vertical: 16})]
/** A column whose children can be scrolled to by their `id`. */
const TARGET_COLUMN = [...COLUMN, scrollTargetLayout()]

type Props = {id: number}

/** A Mess story, set as a broadsheet page. */
export function StoryScreen({id}: Props): React.ReactNode {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	let query = useMessStory(id)
	let story = query.data
	let isPoem = story?.layout.kind === 'poem'
	// The scroll view's content sits inside the side safe areas, which landscape widens.
	let margin = isPoem ? POEM_MARGIN : COLUMN_MARGIN
	let columnWidth = width - insets.left - insets.right - margin * 2
	// The id of the part of the page to scroll to; a template sets it to move the reader.
	let scrollTarget = useNativeState<string | null>(null)
	let scrollTo = React.useCallback((target: string) => scrollTarget.set(target), [scrollTarget])

	if (!story) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<StoryLookupNotice query={query} unavailableText="Story unavailable" />
			</>
		)
	}

	// Only a template that moves the reader binds the page's scroll position.
	let scrolls = story.layout.kind === 'horoscopes'
	let column = scrolls ? TARGET_COLUMN : isPoem ? POEM_COLUMN : COLUMN
	// A lazy stack builds a part only near the screen, so a part the page must scroll to could
	// be missing, and never appear, while the reader is far below it. A page that scrolls is
	// one short post, so it builds every part up front.
	let Column = scrolls ? VStack : LazyVStack

	return (
		<>
			{/* A transparent header lays the page out from the top of the screen, so the paper
			    runs behind the bars and the story scrolls under them; the SwiftUI scroll view
			    still starts its content below the bar, inside the safe area. */}
			<Stack.Screen options={{title: '', headerTransparent: true}} />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Share Story"
					icon="square.and.arrow.up"
					onPress={() => Share.share({url: story.link}).catch(() => undefined)}
				/>
				<Stack.Toolbar.Button
					accessibilityLabel="Open in Safari"
					icon="safari"
					onPress={() => Linking.openURL(story.link).catch(() => undefined)}
				/>
			</Stack.Toolbar>
			<Host style={styles.page}>
				<ScrollView
					modifiers={scrolls ? [...PAGE, scrollPosition(scrollTarget, {anchor: 'top'})] : PAGE}
				>
					<Column alignment="leading" modifiers={column} spacing={14}>
						{isPoem ? (
							<QuietHeader story={story} />
						) : (
							// A comic or artwork is its own picture, so the header leaves it to the body.
							<StoryHeader
								columnWidth={columnWidth}
								showPhoto={story.layout.kind !== 'image'}
								story={story}
							/>
						)}
						<StoryBody columnWidth={columnWidth} scrollTo={scrollTo} story={story} />
						<Divider />
						{story.bylines.map((byline) => (
							<AuthorCard byline={byline} key={byline.id} />
						))}
					</Column>
				</ScrollView>
			</Host>
		</>
	)
}

type StoryBodyProps = {
	story: MessStory
	columnWidth: number
	/** Scrolls the page to the view carrying this id. */
	scrollTo: (target: string) => void
}

/**
 * A story's body, drawn by the template its layout names. Its parts are returned side by
 * side so each lands directly in the page's column.
 */
function StoryBody({story, columnWidth, scrollTo}: StoryBodyProps): React.ReactNode {
	let {layout} = story
	if (layout.kind === 'horoscopes') {
		return <HoroscopesView columnWidth={columnWidth} layout={layout} scrollTo={scrollTo} />
	}
	if (layout.kind === 'poem') return <PoemView layout={layout} />
	if (layout.kind === 'image') {
		return (
			<>
				<ImageView columnWidth={columnWidth} image={layout.image} story={story} />
				<StoryBlocks columnWidth={columnWidth} story={story} />
				<SeriesRow story={story} />
			</>
		)
	}

	return (
		<>
			<StoryBlocks columnWidth={columnWidth} story={story} />
			{/* Playlists, and artwork or comics with no image, come through the API with no body. */}
			{story.blocks.length === 0 ? (
				<SiteLinkCard icon="safari" label="Read on olafmessenger.com" url={story.link} />
			) : null}
		</>
	)
}

type StoryBlocksProps = {story: MessStory; columnWidth: number}

/** A story's blocks in reading order, returned side by side to land in the page's column. */
function StoryBlocks({story, columnWidth}: StoryBlocksProps): React.ReactNode {
	// The first paragraph opens the story, even when a photo comes before it.
	let openingIndex = story.blocks.findIndex((block) => block.type === 'paragraph')
	return story.blocks.map((block, index) => (
		<StoryBlock
			block={block}
			columnWidth={columnWidth}
			isOpening={index === openingIndex}
			// oxlint-disable-next-line react/no-array-index-key -- blocks have no id; a story's body is fixed, so its order is its identity
			key={index}
			storyLink={story.link}
		/>
	))
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
