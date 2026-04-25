import * as React from 'react'
import {View, Text, FlatList, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {Touchable} from '@frogpond/touchable'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import moment from 'moment'
import {redditCommentsOptions} from './query'
import {CommentRow} from './comment-row'
import {htmlToFormattedText} from './html-to-text'
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
	collapsedIds?: Set<string>,
): FlatComment[] {
	return comments.flatMap((comment) => {
		const isCollapsed = collapsedIds?.has(comment.id) ?? false
		return [
			{comment, depth},
			...(isCollapsed
				? []
				: flattenComments(comment.replies, depth + 1, collapsedIds)),
		]
	})
}

function sanitizeBodyText(raw: string): string {
	const trimmed = raw.trimStart()
	if (trimmed.toLowerCase().startsWith('submitted by')) return ''
	return raw
}

export function PostDetailView(): React.ReactNode {
	const navigation = useNavigation()
	const route = useRoute<RouteType>()
	const {
		postUrl,
		title,
		author,
		publishedAt,
		contentHtml,
		communityName,
		postAuthor,
	} = route.params

	const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(
		() => new Set(),
	)

	const {
		data: comments = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery(redditCommentsOptions(postUrl))

	const flatComments = React.useMemo(
		() => flattenComments(comments, 0, collapsedIds),
		[comments, collapsedIds],
	)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			title: communityName,
			headerRight: () => (
				<Touchable
					highlight={false}
					onPress={() => openUrl(postUrl)}
					style={styles.headerButton}
				>
					<Icon name="open-outline" style={styles.headerIcon} />
				</Touchable>
			),
		})
	}, [navigation, postUrl, communityName])

	const date = moment(publishedAt)
	const bodyText = sanitizeBodyText(
		contentHtml ? htmlToFormattedText(contentHtml) : '',
	)

	const toggleCollapse = React.useCallback((id: string) => {
		setCollapsedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}, [])

	const header = (
		<>
			<View style={styles.headerBody}>
				{bodyText ? (
					<Text style={styles.meta}>
						{`${author} · ${date.isValid() ? date.fromNow() : ''}`}
					</Text>
				) : null}
				<Text style={styles.title}>{title}</Text>
				{bodyText ? (
					<Text selectable={true} style={styles.body}>
						{bodyText}
					</Text>
				) : null}
			</View>
			<View style={styles.commentsSectionHeader}>
				<Text style={styles.commentsLabelText}>Comments</Text>
			</View>
		</>
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
				<CommentRow
					comment={item.comment}
					depth={item.depth}
					isCollapsed={collapsedIds.has(item.comment.id)}
					isOP={item.comment.author === postAuthor}
					onPress={
						item.comment.replies.length > 0
							? () => toggleCollapse(item.comment.id)
							: undefined
					}
				/>
			)}
			style={styles.list}
		/>
	)
}

const styles = StyleSheet.create({
	list: {backgroundColor: c.systemBackground},
	contentContainer: {flexGrow: 1},
	headerBody: {
		padding: 16,
	},
	title: {fontSize: 18, fontWeight: '600', marginBottom: 6, color: c.label},
	meta: {fontSize: 13, color: c.secondaryLabel, marginBottom: 12},
	body: {
		fontSize: 15,
		color: c.bodyText,
		lineHeight: 22,
	},
	commentsSectionHeader: {
		backgroundColor: c.secondarySystemBackground,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.separator,
	},
	commentsLabelText: {
		fontSize: 13,
		fontWeight: '600',
		color: c.secondaryLabel,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	headerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 6,
		paddingRight: 16,
	},
	headerIcon: {
		color: c.link,
		fontSize: 24,
	},
})

export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
