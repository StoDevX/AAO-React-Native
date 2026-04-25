import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {parseHtml, innerTextWithSpaces} from '@frogpond/html-lib'
import moment from 'moment'
import * as c from '@frogpond/colors'
import type {RedditCommentType} from './types'

const DEPTH_COLORS = [
	c.systemBlue,
	c.systemGreen,
	c.systemPurple,
	c.systemOrange,
] as const

type Props = {
	comment: RedditCommentType
	depth?: number
	testID?: string
}

export function CommentRow({
	comment,
	depth = 0,
	testID,
}: Props): React.ReactNode {
	const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]
	const body = innerTextWithSpaces(parseHtml(comment.contentHtml))
	const date = moment(comment.publishedAt)
	const meta = `${comment.author} · ${date.isValid() ? date.fromNow() : ''}`

	return (
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
	)
}

const styles = StyleSheet.create({
	comment: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.separator,
	},
	meta: {
		fontSize: 12,
		color: c.secondaryLabel,
		marginBottom: 4,
	},
	body: {
		fontSize: 14,
		color: c.label,
		lineHeight: 20,
	},
})
