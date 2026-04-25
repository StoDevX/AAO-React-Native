import * as React from 'react'
import {View, Text, FlatList, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useRoute, RouteProp} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {parseHtml, innerTextWithSpaces} from '@frogpond/html-lib'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import moment from 'moment'
import {redditCommentsOptions} from './query'
import {CommentRow} from './comment-row'
import type {
	RedditCommentType,
	FlatComment,
	RedditPostDetailParams,
} from './types'

type RouteType = RouteProp<
	{RedditPostDetail: RedditPostDetailParams},
	'RedditPostDetail'
>

function flattenComments(
	comments: RedditCommentType[],
	depth = 0,
): FlatComment[] {
	return comments.flatMap((comment) => [
		{comment, depth},
		...flattenComments(comment.replies, depth + 1),
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

	const date = moment(publishedAt)
	const bodyText = contentHtml
		? innerTextWithSpaces(parseHtml(contentHtml))
		: ''

	const header = (
		<View style={styles.header}>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.meta}>
				{`${author} · ${date.isValid() ? date.fromNow() : ''}`}
			</Text>
			{bodyText ? <Text style={styles.body}>{bodyText}</Text> : null}
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
		borderBottomColor: c.separator,
	},
	title: {fontSize: 18, fontWeight: '600', marginBottom: 6, color: c.label},
	meta: {fontSize: 13, color: c.secondaryLabel, marginBottom: 12},
	body: {
		fontSize: 15,
		color: c.label,
		lineHeight: 22,
		marginBottom: 12,
	},
	commentsLabel: {
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.separator,
	},
	commentsLabelText: {
		fontSize: 13,
		fontWeight: '600',
		color: c.tertiaryLabel,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
})

export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
