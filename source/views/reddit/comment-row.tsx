import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {fastGetTrimmedText} from '@frogpond/html-lib'
import moment from 'moment'
import type {RedditCommentType} from './types'

const DEPTH_COLORS = ['#5C8BC9', '#5CAD8B', '#9B6CC9', '#C97A5C'] as const

type Props = {
	comment: RedditCommentType
	depth?: number
	testID?: string
}

export function CommentRow({comment, depth = 0, testID}: Props): React.ReactNode {
	const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]!
	const body = fastGetTrimmedText(comment.contentHtml)
	const meta = `u/${comment.author} · ${moment(comment.publishedAt).fromNow()}`

	return (
		<>
			<View
				style={[
					styles.comment,
					{
						marginLeft: depth * 14,
						borderLeftWidth: depth > 0 ? 3 : 0,
						borderLeftColor: color,
					},
				]}
				testID={testID}
			>
				<Text style={styles.meta}>{meta}</Text>
				<Text style={styles.body}>{body}</Text>
			</View>
			{comment.replies.map((reply) => (
				<CommentRow key={reply.id} comment={reply} depth={depth + 1} />
			))}
		</>
	)
}

const styles = StyleSheet.create({
	comment: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e0e0e0',
	},
	meta: {
		fontSize: 12,
		color: '#888',
		marginBottom: 4,
	},
	body: {
		fontSize: 14,
		color: '#111',
		lineHeight: 20,
	},
})
