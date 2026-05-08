// source/views/reddit/post-row.tsx
import * as React from 'react'
import {Text, StyleSheet, View} from 'react-native'
import {ListRow} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import moment from 'moment'
import type {RedditPostType} from './types'

type Props = {
	post: RedditPostType
	onPress: (post: RedditPostType) => void
}

export function PostRow({post, onPress}: Props): React.ReactNode {
	const date = moment(post.publishedAt)
	const meta = [post.author, date.isValid() ? date.fromNow() : null]
		.filter((part): part is string => Boolean(part))
		.join(' · ')

	return (
		<ListRow
			arrowPosition="center"
			onPress={() => onPress(post)}
			style={styles.row}
		>
			<View style={styles.content}>
				<Text numberOfLines={1} style={styles.meta}>
					{meta}
				</Text>
				<Text numberOfLines={3} style={styles.title}>
					{post.title}
				</Text>
			</View>
		</ListRow>
	)
}

const styles = StyleSheet.create({
	row: {
		paddingVertical: 12,
	},
	content: {
		flex: 1,
	},
	meta: {
		fontSize: 12,
		color: c.secondaryLabel,
		marginBottom: 5,
	},
	title: {
		fontSize: 15,
		fontWeight: '500',
		color: c.label,
		lineHeight: 20,
	},
})
