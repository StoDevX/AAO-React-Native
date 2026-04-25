import * as React from 'react'
import {View, Text, FlatList, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useRoute, RouteProp} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {HtmlContent} from '@frogpond/html-content'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import moment from 'moment'
import {redditCommentsOptions} from './query'
import {CommentRow} from './comment-row'
import type {RedditCommentType} from './types'

type RedditPostDetailParams = {
	postUrl: string
	title: string
	author: string
	publishedAt: string
	contentHtml: string
}

type RouteType = RouteProp<
	{RedditPostDetail: RedditPostDetailParams},
	'RedditPostDetail'
>

// Flattens nested comment tree to a list while preserving depth info inline.
// We render each node individually so FlatList can virtualise the scroll.
type FlatComment = {comment: RedditCommentType; depth: number}

function flattenComments(
	comments: RedditCommentType[],
	depth = 0,
): FlatComment[] {
	return comments.flatMap((c) => [
		{comment: c, depth},
		...flattenComments(c.replies, depth + 1),
	])
}

export function PostDetailView(): React.ReactNode {
	const route = useRoute<RouteType>()
	const {postUrl, title, author, publishedAt, contentHtml} = route.params

	const {
		data: comments = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery(redditCommentsOptions(postUrl))

	const flatComments = React.useMemo(
		() => flattenComments(comments),
		[comments],
	)

	const header = (
		<View style={styles.header}>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.meta}>
				{`u/${author} · ${moment(publishedAt).fromNow()}`}
			</Text>
			{contentHtml ? (
				<HtmlContent html={contentHtml} style={styles.body} />
			) : null}
			<View style={styles.commentsLabel}>
				<Text style={styles.commentsLabelText}>Comments</Text>
			</View>
		</View>
	)

	if (isError) {
		return (
			<>
				{header}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading comments: ${error}`}
				/>
			</>
		)
	}

	return (
		<FlatList
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No comments yet." />
			}
			ListHeaderComponent={header}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			data={flatComments}
			keyExtractor={(item) => item.comment.id}
			renderItem={({item}) => (
				<CommentRow comment={item.comment} depth={item.depth} />
			)}
			style={styles.list}
		/>
	)
}

const styles = StyleSheet.create({
	list: {backgroundColor: c.systemBackground},
	contentContainer: {flexGrow: 1},
	header: {
		padding: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e0e0e0',
	},
	title: {fontSize: 18, fontWeight: '600', marginBottom: 6},
	meta: {fontSize: 13, color: '#888', marginBottom: 12},
	body: {height: 200, marginBottom: 12},
	commentsLabel: {
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#e0e0e0',
	},
	commentsLabelText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#666',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
})

export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
