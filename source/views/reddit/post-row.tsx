// source/views/reddit/post-row.tsx
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ListRow, Title, Detail} from '@frogpond/lists'
import moment from 'moment'
import type {RedditPostType} from './types'

type Props = {
	post: RedditPostType
	onPress: (post: RedditPostType) => void
}

export function PostRow({post, onPress}: Props): React.ReactNode {
	const date = moment(post.publishedAt)
	const meta = `${post.author} · ${date.isValid() ? date.fromNow() : ''}`

	return (
		<ListRow
			arrowPosition="top"
			onPress={() => onPress(post)}
			style={styles.row}
		>
			<Title lines={3}>{post.title}</Title>
			<Detail lines={1}>{meta}</Detail>
		</ListRow>
	)
}

const styles = StyleSheet.create({
	row: {
		paddingVertical: 10,
	},
})
