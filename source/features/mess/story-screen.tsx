import * as React from 'react'
import {Linking, Share, StyleSheet, useWindowDimensions} from 'react-native'
import {Stack} from 'expo-router'
import {Divider, Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {background, padding} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useQuery} from '@tanstack/react-query'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AuthorCard} from './author-card'
import {paper} from './palette'
import {messFeedOptions} from './query'
import {SiteLinkCard, StoryBlock} from './story-blocks'
import {StoryHeader} from './story-header'

const COLUMN_MARGIN = 20
const PAGE = [background(paper)]
const COLUMN = [padding({horizontal: COLUMN_MARGIN, vertical: 16})]

type Props = {id: number}

/** A Mess story, set as a broadsheet page. */
export function StoryScreen({id}: Props): React.ReactNode {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	// The scroll view's content sits inside the side safe areas, which landscape widens.
	let columnWidth = width - insets.left - insets.right - COLUMN_MARGIN * 2
	let query = useQuery({
		...messFeedOptions,
		select: (stories) => stories.find((s) => s.id === id),
	})
	let story = query.data

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
						text={`A problem occured while loading: ${query.error}`}
					/>
				) : (
					<NoticeView text="Story unavailable" />
				)}
			</>
		)
	}

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
					onPress={() => Linking.openURL(story.link)}
				/>
			</Stack.Toolbar>
			<Host style={styles.page}>
				<ScrollView modifiers={PAGE}>
					<LazyVStack alignment="leading" modifiers={COLUMN} spacing={14}>
						<StoryHeader columnWidth={columnWidth} story={story} />
						{story.blocks.map((block, index) => (
							<StoryBlock
								block={block}
								columnWidth={columnWidth}
								// oxlint-disable-next-line react/no-array-index-key -- blocks have no id; a story's body is fixed, so its order is its identity
								key={index}
								storyLink={story.link}
							/>
						))}
						{/* Artwork, comics and playlists come through the API with no body. */}
						{story.blocks.length === 0 ? (
							<SiteLinkCard icon="safari" label="Read on olafmessenger.com" url={story.link} />
						) : null}
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

const styles = StyleSheet.create({
	page: {flex: 1},
})
