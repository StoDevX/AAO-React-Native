import * as React from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {Host, List, RNHostView, VStack} from '@expo/ui/swift-ui'
import {
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import type {UseQueryResult} from '@tanstack/react-query'
import type {RedditPostType} from './types'
import {PostRow} from './post-row'
import {PostRowCard} from './post-row-card'
import {PostRowHero} from './post-row-hero'

export type PostListVariant = 'A' | 'C'

type Props = {
	query: UseQueryResult<RedditPostType[]>
	onPressPost: (post: RedditPostType) => void
	variant?: PostListVariant
}

/// The gap above and below a card, which the row itself draws since the list
/// rows carry no insets of their own.
const CARD_GAP = 12

const NO_INSETS = {top: 0, leading: 0, bottom: 0, trailing: 0}

export function PostList({query, onPressPost, variant = 'C'}: Props): React.ReactNode {
	const {data = [], error, refetch, isError, isLoading} = query
	const {width} = useWindowDimensions()

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	if (!data.length) {
		return <NoticeView text="No posts found." />
	}

	const isGrouped = variant === 'C'

	return (
		<Host
			matchContents={false}
			style={[
				styles.host,
				{backgroundColor: isGrouped ? c.systemGroupedBackground : c.systemBackground},
			]}
		>
			<List
				modifiers={[
					listStyle('plain'),
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				{data.map((post, index) => (
					<VStack
						key={post.id}
						modifiers={[
							listRowInsets(NO_INSETS),
							listRowBackground('clear'),
							// The cards draw their own edges and gaps; a separator
							// between them would cut across the rounded corners.
							...(isGrouped ? [listRowSeparator('hidden')] : []),
						]}
					>
						<RNHostView matchContents={false}>
							{/* A hosted view is sized to what it intrinsically wants, and
						    a card built from `marginHorizontal` and `width: '100%'`
						    wants nothing in particular -- so the width it lays out
						    against is stated here. */}
							<View style={[isGrouped && styles.cardRow, {width}]}>
								{isGrouped && index === 0 && post.thumbnail ? (
									<PostRowHero onPress={onPressPost} post={post} />
								) : isGrouped ? (
									<PostRowCard onPress={onPressPost} post={post} />
								) : (
									<PostRow onPress={onPressPost} post={post} />
								)}
							</View>
						</RNHostView>
					</VStack>
				))}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	cardRow: {
		paddingVertical: CARD_GAP / 2,
	},
})
