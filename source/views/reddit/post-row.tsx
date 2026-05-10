// source/views/reddit/post-row.tsx
import * as React from 'react'
import {Text, StyleSheet, View, Image, Pressable} from 'react-native'
import * as c from '@frogpond/colors'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import type {RedditPostType} from './types'

type Props = {
	post: RedditPostType
	onPress: (post: RedditPostType) => void
}

export function PostRow({post, onPress}: Props): React.ReactNode {
	const parsedDate = parseISO(post.publishedAt)
	const timeAgo = isValid(parsedDate)
		? formatDistanceToNow(parsedDate, {addSuffix: true})
		: null
	const meta = [post.author, timeAgo].filter(Boolean).join(' · ')

	return (
		<Pressable
			accessibilityLabel={post.title}
			accessibilityRole="button"
			onPress={() => onPress(post)}
			style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
		>
			{post.thumbnail ? (
				<Image
					accessibilityIgnoresInvertColors={true}
					resizeMode="cover"
					source={{uri: post.thumbnail}}
					style={styles.thumbnail}
				/>
			) : (
				<View style={styles.thumbnailPlaceholder} />
			)}
			<View style={styles.content}>
				<Text numberOfLines={3} style={styles.title}>
					{post.title}
				</Text>
				<Text numberOfLines={1} style={styles.meta}>
					{meta}
				</Text>
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: c.systemBackground,
		gap: 12,
	},
	rowPressed: {
		backgroundColor: c.systemGray6,
	},
	content: {
		flex: 1,
		gap: 5,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		color: c.label,
		lineHeight: 21,
	},
	meta: {
		fontSize: 12,
		color: c.secondaryLabel,
	},
	thumbnail: {
		width: 64,
		height: 64,
		borderRadius: 8,
		backgroundColor: c.secondarySystemBackground,
		flexShrink: 0,
	},
	thumbnailPlaceholder: {
		width: 64,
		height: 64,
		flexShrink: 0,
	},
})
