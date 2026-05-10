// source/views/reddit/post-row-hero.tsx
import * as React from 'react'
import {Text, StyleSheet, View, Image, Pressable} from 'react-native'
import * as c from '@frogpond/colors'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import type {RedditPostType} from './types'

type Props = {
	post: RedditPostType
	onPress: (post: RedditPostType) => void
}

export function PostRowHero({post, onPress}: Props): React.ReactNode {
	const parsedDate = parseISO(post.publishedAt)
	const timeAgo = isValid(parsedDate)
		? formatDistanceToNow(parsedDate, {addSuffix: true})
		: null

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
					style={styles.image}
				/>
			) : (
				<View style={[styles.image, styles.imagePlaceholder]} />
			)}
			<View style={styles.overlay} />
			<View style={styles.textContainer}>
				{timeAgo ? (
					<View style={styles.pill}>
						<Text style={styles.pillText}>{timeAgo}</Text>
					</View>
				) : null}
				<Text numberOfLines={2} style={styles.title}>
					{post.title}
				</Text>
				<Text numberOfLines={1} style={styles.author}>
					{post.author}
				</Text>
			</View>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: c.systemBackground,
		borderRadius: 16,
		marginHorizontal: 16,
		overflow: 'hidden',
		height: 220,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.12,
		shadowRadius: 8,
		elevation: 4,
	},
	cardPressed: {
		opacity: 0.88,
	},
	image: {
		...StyleSheet.absoluteFillObject,
		width: '100%',
		height: '100%',
	},
	imagePlaceholder: {
		backgroundColor: c.systemGray4,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.45)',
	},
	textContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 14,
		gap: 4,
	},
	pill: {
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255,255,255,0.25)',
		borderRadius: 100,
		paddingHorizontal: 8,
		paddingVertical: 3,
		marginBottom: 4,
	},
	pillText: {
		fontSize: 11,
		color: '#fff',
		fontWeight: '500',
	},
	title: {
		fontSize: 18,
		fontWeight: '700',
		color: '#fff',
		lineHeight: 23,
	},
	author: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.75)',
	},
})
