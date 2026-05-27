import * as React from 'react'
import {
	View,
	Text,
	FlatList,
	Image,
	Modal,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {ContextMenu} from '@frogpond/context-menu'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import {redditCommentsOptions} from './query'
import {CommentRow} from './comment-row'
import {htmlToSegments} from '@frogpond/html-lib'
import type {Segment} from '@frogpond/html-lib'
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

function sanitizeBodySegments(segments: Segment[]): Segment[] {
	const firstText = segments.find((s) => s.type === 'text')?.text?.trimStart()
	if (firstText?.toLowerCase().startsWith('submitted by')) return []
	return segments
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
		postType,
		imageUrl,
		images = [],
		linkUrl,
		linkDomain,
		crosspostParent,
		pollData,
	} = route.params

	const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(
		() => new Set(),
	)
	const [fullscreenIndex, setFullscreenIndex] = React.useState<number | null>(
		null,
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

	const handleMenuAction = React.useCallback(
		(key: string) => {
			if (key === 'Open in Browser') {
				openUrl(postUrl)
			} else if (key === 'Share') {
				Share.share({url: postUrl}).catch((err) => console.warn(err))
			}
		},
		[postUrl],
	)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			title: communityName,
			headerRight: () => (
				<ContextMenu
					actions={[
						{
							key: 'Open in Browser',
							icon: {iconType: 'SYSTEM', iconValue: 'safari'},
						},
						{
							key: 'Share',
							icon: {iconType: 'SYSTEM', iconValue: 'square.and.arrow.up'},
						},
					]}
					isMenuPrimaryAction={true}
					onPressMenuItem={handleMenuAction}
					title=""
				>
					<View style={styles.headerButton}>
						<Icon name="ellipsis-horizontal" style={styles.headerIcon} />
					</View>
				</ContextMenu>
			),
		})
	}, [navigation, communityName, handleMenuAction])

	const parsedDate = parseISO(publishedAt)
	const metaText = [
		author,
		isValid(parsedDate)
			? formatDistanceToNow(parsedDate, {addSuffix: true})
			: null,
	]
		.filter((part): part is string => Boolean(part))
		.join(' · ')
	const bodySegments = sanitizeBodySegments(
		contentHtml ? htmlToSegments(contentHtml) : [],
	)

	// Build the image list to display: prefer gallery images, then full-res imageUrl, then thumbnail
	const displayImages: string[] = (() => {
		if (images.length > 0) return images
		if (imageUrl) return [imageUrl]
		if (thumbnail) return [thumbnail]
		return []
	})()

	const isCrosspost =
		postType === 'crosspost' ||
		(bodySegments.length === 0 && !thumbnail && !linkUrl)

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

				{/* Image / Gallery */}
				{displayImages.length > 0 ? (
					displayImages.length === 1 ? (
						<Pressable
							accessibilityHint="Double tap to view fullscreen"
							accessibilityLabel={title}
							accessibilityRole="imagebutton"
							onPress={() => setFullscreenIndex(0)}
						>
							<Image
								resizeMode="cover"
								source={{uri: displayImages[0]}}
								style={styles.postImage}
							/>
						</Pressable>
					) : (
						<View>
							<ScrollView
								horizontal={true}
								pagingEnabled={true}
								showsHorizontalScrollIndicator={false}
							>
								{displayImages.map((uri, i) => (
									<Pressable
										key={uri}
										accessibilityHint="Double tap to view fullscreen"
										accessibilityLabel={`Photo ${i + 1} of ${displayImages.length}`}
										accessibilityRole="imagebutton"
										onPress={() => setFullscreenIndex(i)}
									>
										<Image
											resizeMode="cover"
											source={{uri}}
											style={styles.galleryImage}
										/>
									</Pressable>
								))}
							</ScrollView>
							<Text style={styles.galleryCount}>
								{displayImages.length} photos · swipe to browse
							</Text>
						</View>
					)
				) : null}

				{/* Body text */}
				{bodySegments.length > 0 ? (
					<Text selectable={true} style={styles.body}>
						{bodySegments.map((seg, i) =>
							seg.type === 'link' ? (
								<Text
									key={i}
									onPress={() => openUrl(seg.url)}
									style={styles.link}
								>
									{seg.text}
								</Text>
							) : (
								seg.text
							),
						)}
					</Text>
				) : null}

				{/* Link card */}
				{linkUrl ? (
					<Pressable
						accessibilityLabel={`Open link: ${linkDomain ?? linkUrl}`}
						accessibilityRole="link"
						onPress={() => openUrl(linkUrl)}
						style={styles.linkCard}
					>
						<Icon name="globe-outline" style={styles.linkCardIcon} />
						<Text numberOfLines={1} style={styles.linkCardDomain}>
							{linkDomain ?? linkUrl}
						</Text>
						<Icon
							name="chevron-forward-outline"
							style={styles.linkCardChevron}
						/>
					</Pressable>
				) : null}

				{/* Crosspost card */}
				{isCrosspost ? (
					<Pressable
						accessibilityLabel={
							crosspostParent
								? `View original post from r/${crosspostParent.subreddit}`
								: 'View linked post on Reddit'
						}
						accessibilityRole="link"
						onPress={() => openUrl(crosspostParent?.permalink ?? postUrl)}
						style={styles.crosspostCard}
					>
						<View style={styles.crosspostIconRow}>
							<Icon name="link-outline" style={styles.crosspostIcon} />
							<Text style={styles.crosspostLabel}>
								{crosspostParent
									? `r/${crosspostParent.subreddit}`
									: 'Crosspost'}
							</Text>
						</View>
						<Text numberOfLines={2} style={styles.crosspostTitle}>
							{crosspostParent?.title ?? title}
						</Text>
						{crosspostParent?.selftext ? (
							<Text numberOfLines={3} style={styles.crosspostBody}>
								{crosspostParent.selftext}
							</Text>
						) : null}
						<Text style={styles.crosspostMeta}>
							{crosspostParent
								? `u/${crosspostParent.author} · Tap to view`
								: 'Tap to view on Reddit'}
						</Text>
					</Pressable>
				) : null}

				{/* Poll */}
				{pollData ? (
					<View style={styles.pollContainer}>
						<Text style={styles.pollHeader}>
							{pollData.totalVotes.toLocaleString()} votes
						</Text>
						{pollData.options.map((opt, i) => {
							const pct =
								pollData.totalVotes > 0
									? Math.round((opt.votes / pollData.totalVotes) * 100)
									: 0
							return (
								<View key={i} style={styles.pollOption}>
									<View style={[styles.pollBar, {width: `${pct}%`}]} />
									<View style={styles.pollOptionRow}>
										<Text style={styles.pollOptionText}>{opt.text}</Text>
										<Text style={styles.pollOptionPct}>{pct}%</Text>
									</View>
								</View>
							)
						})}
						<Pressable
							accessibilityRole="link"
							onPress={() => openUrl(postUrl)}
						>
							<Text style={styles.pollViewLink}>View poll on Reddit</Text>
						</Pressable>
					</View>
				) : null}
			</View>

			{/* Fullscreen image modal */}
			{fullscreenIndex !== null ? (
				<Modal
					animationType="fade"
					onRequestClose={() => setFullscreenIndex(null)}
					transparent={true}
					visible={true}
				>
					<Pressable
						accessibilityLabel="Close fullscreen image"
						accessibilityRole="button"
						onPress={() => setFullscreenIndex(null)}
						style={styles.modalBackdrop}
					>
						<Image
							resizeMode="contain"
							source={{uri: displayImages[fullscreenIndex]}}
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
	link: {
		color: c.link,
		textDecorationLine: 'underline',
	},
	postImage: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: 12,
		backgroundColor: c.secondarySystemBackground,
	},
	galleryImage: {
		width: 300,
		aspectRatio: 3 / 4,
		borderRadius: 12,
		marginRight: 8,
		backgroundColor: c.secondarySystemBackground,
	},
	galleryCount: {
		fontSize: 12,
		color: c.secondaryLabel,
		textAlign: 'center',
		marginTop: 6,
	},
	linkCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: c.separator,
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 14,
		backgroundColor: c.secondarySystemBackground,
	},
	linkCardIcon: {
		fontSize: 16,
		color: c.link,
	},
	linkCardDomain: {
		flex: 1,
		fontSize: 14,
		color: c.link,
	},
	linkCardChevron: {
		fontSize: 14,
		color: c.tertiaryLabel,
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
	crosspostBody: {
		fontSize: 13,
		color: c.secondaryLabel,
		lineHeight: 18,
	},
	crosspostMeta: {
		fontSize: 12,
		color: c.link,
	},
	pollContainer: {
		gap: 8,
	},
	pollHeader: {
		fontSize: 12,
		color: c.secondaryLabel,
		marginBottom: 4,
	},
	pollOption: {
		height: 44,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: c.secondarySystemBackground,
		justifyContent: 'center',
	},
	pollBar: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		backgroundColor: c.systemBlue,
		opacity: 0.18,
	},
	pollOptionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
	},
	pollOptionText: {
		fontSize: 14,
		color: c.label,
		flex: 1,
	},
	pollOptionPct: {
		fontSize: 13,
		fontWeight: '600',
		color: c.secondaryLabel,
	},
	pollViewLink: {
		fontSize: 12,
		color: c.link,
	},
})

export const NavigationKey = 'RedditPostDetail'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: '',
}
