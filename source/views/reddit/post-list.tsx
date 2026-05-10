// source/views/reddit/post-list.tsx
import * as React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import type {UseQueryResult} from '@tanstack/react-query'
import type {RedditPostType} from './types'
import {PostRow} from './post-row'
import {PostRowCard} from './post-row-card'
import {PostRowHero} from './post-row-hero'

export type PostListVariant = 'A' | 'B' | 'C'

type Props = {
	query: UseQueryResult<RedditPostType[]>
	onPressPost: (post: RedditPostType) => void
	variant?: PostListVariant
}

function Separator({variant}: {variant: PostListVariant}): React.ReactNode {
	if (variant === 'B' || variant === 'C') {
		return <View style={styles.cardGap} />
	}
	return <View style={styles.separator} />
}

export function PostList({
	query,
	onPressPost,
	variant = 'C',
}: Props): React.ReactNode {
	const {data = [], error, refetch, isRefetching, isError, isLoading} = query

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occurred while loading: ${error}`}
			/>
		)
	}

	const isGrouped = variant === 'B' || variant === 'C'

	return (
		<FlatList
			ItemSeparatorComponent={() => <Separator variant={variant} />}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No posts found." />
			}
			ListFooterComponent={isGrouped ? <View style={styles.cardGap} /> : null}
			ListHeaderComponent={isGrouped ? <View style={styles.cardGap} /> : null}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			data={data}
			keyExtractor={(item) => item.id}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item, index}) => {
				if (variant === 'C' && index === 0) {
					return <PostRowHero onPress={onPressPost} post={item} />
				}
				if (variant === 'B' || variant === 'C') {
					return <PostRowCard onPress={onPressPost} post={item} />
				}
				return <PostRow onPress={onPressPost} post={item} />
			}}
			style={[
				styles.list,
				{
					backgroundColor: isGrouped
						? c.systemGroupedBackground
						: c.systemBackground,
				},
			]}
		/>
	)
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: c.separator,
		marginLeft: 16,
	},
	cardGap: {
		height: 12,
	},
})
