import * as React from 'react'
import {Linking, Share, StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {Host, LazyVStack, ScrollView, useNativeState, VStack} from '@expo/ui/swift-ui'
import {background, padding, scrollPosition, scrollTargetLayout} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {openURLAction} from '../../lib/open-url-action'
import {AuthorCards} from './author-card'
import {HoroscopesView} from './horoscopes-view'
import {FeatureView} from './feature-view'
import {ImageView} from './image-view'
import {keepsDarkMode} from './lib/photo-story'
import {PAGE_MARGIN} from './mess-page'
import {paper} from './palette'
import {PlaylistView} from './playlist-view'
import {puzzleIcon, puzzleLabel, puzzleUrl} from './lib/puzzle'
import {RecipeView} from './recipe-view'
import {PoemView} from './poem-view'
import {QuietHeader} from './quiet-header'
import {SeriesRow} from './series-row'
import {BLOCK_SPACING, SiteLinkCard, StoryBlocks} from './story-blocks'
import {StoryHeader} from './story-header'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStore} from './store'
import {usePaper} from './paper-context'
import type {MessStory} from './types'
import {useColumnWidth} from './use-column-width'
import {useMessStory} from './use-mess-story'

/** A quiet page's wider margins, a poem's or a feature's, which give its words and pictures more air. */
const QUIET_MARGIN = 28
/** The paper, and a link in the story's text opening where the reader's link setting says. */
const PAGE = [background(paper), openURLAction(openUrl)]
const COLUMN = [padding({horizontal: PAGE_MARGIN, vertical: 16})]
const QUIET_COLUMN = [padding({horizontal: QUIET_MARGIN, vertical: 16})]
/** A column whose children can be scrolled to by their `id`. */
const TARGET_COLUMN = [...COLUMN, scrollTargetLayout()]

/**
 * A Photo story's navigation bar, dark over its dark page. The page's own Host carries the dark
 * scheme, so only this screen turns dark, and a viewer or story opened over it leaves it as it is.
 */
const DARK_SCREEN = {
	unstable_nativeProps: {headerConfig: {experimental_userInterfaceStyle: 'dark'}},
} as const

/** Names a Crossword or Puzzle post's Solve button, for a UI test. */
export const PUZZLE_SOLVE_ID = 'mess-puzzle-solve'

type Props = {id: number}

/** A Mess story, set as a broadsheet page. */
export function StoryScreen({id}: Props): React.ReactNode {
	let query = useMessStory(id)
	let recordOpened = useMessStore((state) => state.recordOpened)
	// Every way into a story ends here, so this one call counts it towards its issue's stains.
	React.useEffect(() => {
		recordOpened(id)
	}, [id, recordOpened])
	let story = query.data
	let keepPhotoStoriesDark = useMessStore((state) => state.keepPhotoStoriesDark)
	let darkMode = story ? keepsDarkMode(story, keepPhotoStoriesDark) : false
	// A poem, photo or short story is set quietly: a lighter header and wider margins.
	let isQuiet = story?.layout.kind === 'poem' || story?.layout.kind === 'feature'
	let margin = isQuiet ? QUIET_MARGIN : PAGE_MARGIN
	let columnWidth = useColumnWidth(margin)
	// The id of the part of the page to scroll to; a template sets it to move the reader.
	let scrollTarget = useNativeState<string | null>(null)
	let scrollTo = React.useCallback((target: string) => scrollTarget.set(target), [scrollTarget])

	if (!story) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<StoryLookupNotice query={query} unavailableText="Story Unavailable" />
			</>
		)
	}

	// Only a template that moves the reader binds the page's scroll position.
	let scrolls = story.layout.kind === 'horoscopes'
	let column = scrolls ? TARGET_COLUMN : isQuiet ? QUIET_COLUMN : COLUMN
	// A lazy stack builds a part only near the screen, so a part the page must scroll to could
	// be missing, and never appear, while the reader is far below it. A page that scrolls is
	// one short post, so it builds every part up front.
	let Column = scrolls ? VStack : LazyVStack

	return (
		<>
			{/* A transparent header lays the page out from the top of the screen, so the paper
			    runs behind the bars and the story scrolls under them; the SwiftUI scroll view
			    still starts its content below the bar, inside the safe area. */}
			<Stack.Screen
				options={{
					title: '',
					headerTransparent: true,
					...(darkMode ? DARK_SCREEN : null),
				}}
			/>
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
			<Host colorScheme={darkMode ? 'dark' : undefined} style={styles.page}>
				<ScrollView
					modifiers={scrolls ? [...PAGE, scrollPosition(scrollTarget, {anchor: 'top'})] : PAGE}
				>
					<Column alignment="leading" modifiers={column} spacing={BLOCK_SPACING}>
						{isQuiet ? (
							<QuietHeader story={story} />
						) : (
							// A comic, artwork or playlist draws its picture in the body, so the header leaves it out.
							<StoryHeader
								columnWidth={columnWidth}
								showPhoto={story.layout.kind !== 'image' && story.layout.kind !== 'playlist'}
								story={story}
							/>
						)}
						<StoryBody columnWidth={columnWidth} scrollTo={scrollTo} story={story} />
						<AuthorCards bylines={story.bylines} />
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
	let {site} = usePaper()
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
	if (layout.kind === 'puzzle') {
		return (
			<>
				{/* PuzzleMe's player opens in the browser sheet, which keeps a half-solved puzzle's
				    progress between visits. */}
				<SiteLinkCard
					icon={puzzleIcon(layout.puzzle)}
					identifier={PUZZLE_SOLVE_ID}
					label={puzzleLabel(layout.puzzle)}
					prominent={true}
					url={puzzleUrl(layout.puzzle, story.link)}
				/>
				<StoryBlocks columnWidth={columnWidth} story={story} />
			</>
		)
	}
	if (layout.kind === 'playlist') {
		return <PlaylistView columnWidth={columnWidth} layout={layout} story={story} />
	}
	if (layout.kind === 'recipe') {
		return <RecipeView columnWidth={columnWidth} layout={layout} story={story} />
	}
	if (layout.kind === 'feature') {
		return <FeatureView columnWidth={columnWidth} layout={layout} story={story} />
	}

	return (
		<>
			<StoryBlocks columnWidth={columnWidth} story={story} />
			{/* Artwork or comics with no image come through the API with no body. */}
			{story.blocks.length === 0 ? (
				<SiteLinkCard icon="safari" label={`Read on ${site}`} url={story.link} />
			) : null}
		</>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
