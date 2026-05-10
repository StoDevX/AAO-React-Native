// source/views/reddit/post-row-card.tsx
import * as React from 'react'
import {Text, StyleSheet, View, Image, Pressable} from 'react-native'
import * as c from '@frogpond/colors'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import type {RedditPostType} from './types'

type Props = {
	post: RedditPostType
	onPress: (post: RedditPostType) => void
}

export function PostRowCard({post, onPress}: Props): React.ReactNode {
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
			style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
		>
			{post.thumbnail ? (
				<Image
					accessibilityIgnoresInvertColors={true}
					resizeMode="cover"
					source={{uri: post.thumbnail}}
					style={styles.banner}
				/>
			) : null}
			<View style={styles.body}>
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
	card: {
		backgroundColor: c.systemBackground,
		borderRadius: 12,
		marginHorizontal: 16,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 1},
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	cardPressed: {
		opacity: 0.85,
	},
	banner: {
		width: '100%',
		height: 160,
		backgroundColor: c.secondarySystemBackground,
	},
	body: {
		padding: 14,
		gap: 6,
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
})
