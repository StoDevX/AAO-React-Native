import * as React from 'react'
import {Linking, Share, StyleSheet, useWindowDimensions} from 'react-native'
import {Stack} from 'expo-router'
import {Divider, Host, LazyVStack, ScrollView, useNativeState} from '@expo/ui/swift-ui'
import {background, padding, scrollPosition, scrollTargetLayout} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useQuery} from '@tanstack/react-query'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AuthorCard} from './author-card'
import {HoroscopesView} from './horoscopes-view'
import {paper} from './palette'
import {messFeedOptions} from './query'
import {SiteLinkCard, StoryBlock} from './story-blocks'
import {StoryHeader} from './story-header'
import type {MessStory} from './types'

const COLUMN_MARGIN = 20
const PAGE = [background(paper)]
const COLUMN = [padding({horizontal: COLUMN_MARGIN, vertical: 16})]
/** A column whose children can be scrolled to by their `id`. */
const TARGET_COLUMN = [...COLUMN, scrollTargetLayout()]

type Props = {id: number}

/** A Mess story, set as a broadsheet page. */
export function StoryScreen({id}: Props): React.ReactNode {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	// The scroll view's content sits inside the side safe areas, which landscape widens.
	let columnWidth = width - insets.left - insets.right - COLUMN_MARGIN * 2
	// A stable selector, so the story is found again only when the feed or the id changes.
	let selectStory = React.useCallback(
		(stories: MessStory[]) => stories.find((s) => s.id === id),
		[id],
	)
	let query = useQuery({...messFeedOptions, select: selectStory})
	let story = query.data
	// The id of the part of the page to scroll to; a template sets it to move the reader.
	let scrollTarget = useNativeState<string | null>(null)
	let scrollTo = React.useCallback((target: string) => scrollTarget.set(target), [scrollTarget])

	if (!story) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				{query.isPending ? (
					<LoadingView />
				) : query.isLoadingError ? (
					<NoticeView
						buttonText="Try Again"
						onPress={() => query.refetch()}
						text={`A problem occurred while loading: ${query.error}`}
					/>
				) : (
					<NoticeView text="Story unavailable" />
				)}
			</>
		)
	}

	// Only a template that scrolls the page binds its position, so an article scrolls as it always has.
	let scrolls = story.layout.kind === 'horoscopes'

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
					<LazyVStack alignment="leading" modifiers={scrolls ? TARGET_COLUMN : COLUMN} spacing={14}>
						<StoryHeader columnWidth={columnWidth} story={story} />
						<StoryBody columnWidth={columnWidth} scrollTo={scrollTo} story={story} />
						<Divider />
						{story.bylines.map((byline) => (
							<AuthorCard byline={byline} key={byline.id} />
						))}
					</LazyVStack>
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
	if (layout.kind === 'horoscopes') return <HoroscopesView layout={layout} scrollTo={scrollTo} />

	// The first paragraph opens the story, even when a photo comes before it.
	let openingIndex = story.blocks.findIndex((block) => block.type === 'paragraph')
	return (
		<>
			{story.blocks.map((block, index) => (
				<StoryBlock
					block={block}
					columnWidth={columnWidth}
					isOpening={index === openingIndex}
					// oxlint-disable-next-line react/no-array-index-key -- blocks have no id; a story's body is fixed, so its order is its identity
					key={index}
					storyLink={story.link}
				/>
			))}
			{/* Artwork, comics and playlists come through the API with no body. */}
			{story.blocks.length === 0 ? (
				<SiteLinkCard icon="safari" label="Read on olafmessenger.com" url={story.link} />
			) : null}
		</>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
