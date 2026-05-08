// source/views/reddit/post-list.tsx
import * as React from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import type {UseQueryResult} from '@tanstack/react-query'
import type {RedditPostType} from './types'
import {PostRow} from './post-row'

type Props = {
	query: UseQueryResult<RedditPostType[]>
	onPressPost: (post: RedditPostType) => void
}

export function PostList({query, onPressPost}: Props): React.ReactNode {
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

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No posts found." />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			data={data}
			keyExtractor={(item) => item.id}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => <PostRow onPress={onPressPost} post={item} />}
			style={styles.list}
		/>
	)
}

const styles = StyleSheet.create({
	list: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})
