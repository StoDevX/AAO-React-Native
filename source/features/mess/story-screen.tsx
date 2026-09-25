import * as React from 'react'
import {Linking, Share, StyleSheet, useWindowDimensions} from 'react-native'
import {Stack} from 'expo-router'
import {Divider, Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {background, padding} from '@expo/ui/swift-ui/modifiers'
import {NoticeView} from '@frogpond/notice'
import {useQuery} from '@tanstack/react-query'
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
	let columnWidth = width - COLUMN_MARGIN * 2
	let story = useQuery({
		...messFeedOptions,
		select: (stories) => stories.find((s) => s.id === id),
	}).data

	if (!story) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<NoticeView text="Story unavailable" />
			</>
		)
	}

	return (
		<>
			<Stack.Screen options={{title: ''}} />
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
