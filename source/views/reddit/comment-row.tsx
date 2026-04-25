import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import moment from 'moment'
import * as c from '@frogpond/colors'
import {htmlToFormattedText} from './html-to-text'
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
	isOP?: boolean
	testID?: string
}

export function CommentRow({
	comment,
	depth = 0,
	isOP = false,
	testID,
}: Props): React.ReactNode {
	const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]
	const body = htmlToFormattedText(comment.contentHtml)
	const date = moment(comment.publishedAt)
	const relativeTime = date.isValid() ? date.fromNow() : ''

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
			<View style={styles.metaRow}>
				<Text style={styles.author}>{comment.author}</Text>
				{isOP ? (
					<View style={styles.opBadge}>
						<Text style={styles.opBadgeText}>OP</Text>
					</View>
				) : null}
				{relativeTime ? (
					<Text style={styles.timestamp}>{` · ${relativeTime}`}</Text>
				) : null}
			</View>
			<Text selectable={true} style={styles.body}>
				{body}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	comment: {
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.separator,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		flexWrap: 'wrap',
	},
	author: {
		fontSize: 13,
		fontWeight: '600',
		color: c.label,
	},
	opBadge: {
		backgroundColor: c.systemBlue,
		borderRadius: 3,
		paddingHorizontal: 5,
		paddingVertical: 1,
		marginLeft: 5,
	},
	opBadgeText: {
		fontSize: 10,
		fontWeight: '700',
		color: '#fff',
	},
	timestamp: {
		fontSize: 13,
		color: c.secondaryLabel,
	},
	body: {
		fontSize: 14,
		color: c.secondaryLabel,
		lineHeight: 20,
	},
})
