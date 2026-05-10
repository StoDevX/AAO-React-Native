import * as React from 'react'
import {
	View,
	Text,
	FlatList,
	Image,
	Modal,
	Pressable,
	StyleSheet,
} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {Touchable} from '@frogpond/touchable'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import {redditCommentsOptions} from './query'
import {CommentRow} from './comment-row'
import {htmlToFormattedText} from '@frogpond/html-lib'
import type {
	RedditCommentType,
	FlatComment,
	RedditPostDetailParams,
} from './types'
import {formatCommentCount} from './utils/format-count'

type RouteType = RouteProp<
	{RedditPostDetail: RedditPostDetailParams},
	'RedditPostDetail'
>

function countAllComments(comments: RedditCommentType[]): number {
	return comments.reduce(
		(total, comment) => total + 1 + countAllComments(comment.replies),
		0,
	)
}

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
		thumbnail,
		communityName,
		postAuthor,
	} = route.params

	const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(
		() => new Set(),
	)
	const [imageFullscreen, setImageFullscreen] = React.useState(false)

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

	const parsedDate = parseISO(publishedAt)
	const metaText = [
		author,
		isValid(parsedDate)
			? formatDistanceToNow(parsedDate, {addSuffix: true})
			: null,
	]
		.filter((part): part is string => Boolean(part))
		.join(' · ')
	const bodyText = sanitizeBodyText(
		contentHtml ? htmlToFormattedText(contentHtml) : '',
	)
	const isCrosspost = !bodyText && !thumbnail

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
				{metaText ? <Text style={styles.meta}>{metaText}</Text> : null}
				<Text style={styles.title}>{title}</Text>
				{thumbnail ? (
					<Pressable
						accessibilityHint="Double tap to view fullscreen"
						accessibilityLabel={title}
						accessibilityRole="imagebutton"
						onPress={() => setImageFullscreen(true)}
					>
						<Image
							resizeMode="cover"
							source={{uri: thumbnail}}
							style={styles.postImage}
						/>
					</Pressable>
				) : null}
				{bodyText ? (
					<Text selectable={true} style={styles.body}>
						{bodyText}
					</Text>
				) : null}
				{isCrosspost ? (
					<Pressable
						accessibilityLabel="View linked post on Reddit"
						accessibilityRole="link"
						onPress={() => openUrl(postUrl)}
						style={styles.crosspostCard}
					>
						<View style={styles.crosspostIconRow}>
							<Icon name="link-outline" style={styles.crosspostIcon} />
							<Text style={styles.crosspostLabel}>Linked Post</Text>
						</View>
						<Text numberOfLines={2} style={styles.crosspostTitle}>
							{title}
						</Text>
						<Text style={styles.crosspostMeta}>Tap to view on Reddit</Text>
					</Pressable>
				) : null}
			</View>
			{thumbnail ? (
				<Modal
					animationType="fade"
					onRequestClose={() => setImageFullscreen(false)}
					transparent={true}
					visible={imageFullscreen}
				>
					<Pressable
						accessibilityLabel="Close fullscreen image"
						accessibilityRole="button"
						onPress={() => setImageFullscreen(false)}
						style={styles.modalBackdrop}
					>
						<Image
							resizeMode="contain"
							source={{uri: thumbnail}}
							style={styles.modalImage}
						/>
					</Pressable>
				</Modal>
			) : null}
			<View style={styles.commentsSectionHeader}>
				<Text style={styles.commentsLabelText}>
					{formatCommentCount(countAllComments(comments))}
				</Text>
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
		gap: 8,
	},
	title: {fontSize: 20, fontWeight: '700', color: c.label, lineHeight: 26},
	meta: {fontSize: 13, color: c.secondaryLabel},
	body: {
		fontSize: 15,
		color: c.bodyText,
		lineHeight: 22,
		marginTop: 4,
	},
	postImage: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: 12,
		backgroundColor: c.secondarySystemBackground,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.92)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalImage: {
		width: '100%',
		height: '100%',
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
	crosspostCard: {
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: c.separator,
		borderRadius: 12,
		padding: 14,
		backgroundColor: c.secondarySystemBackground,
		gap: 4,
	},
	crosspostIconRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 4,
	},
	crosspostIcon: {
		fontSize: 14,
		color: c.secondaryLabel,
	},
	crosspostLabel: {
		fontSize: 11,
		fontWeight: '600',
		color: c.secondaryLabel,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	crosspostTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: c.label,
		lineHeight: 20,
	},
	crosspostMeta: {
		fontSize: 12,
		color: c.link,
	},
})

export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
