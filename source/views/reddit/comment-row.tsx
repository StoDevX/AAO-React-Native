import * as React from 'react'
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native'
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
	isCollapsed?: boolean
	onPress?: () => void
	testID?: string
}

export function CommentRow({
	comment,
	depth = 0,
	isOP = false,
	isCollapsed = false,
	onPress,
	testID,
}: Props): React.ReactNode {
	const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]
	const body = htmlToFormattedText(comment.contentHtml)
	const date = moment(comment.publishedAt)
	const relativeTime = date.isValid() ? date.fromNow() : ''
	const hasReplies = comment.replies.length > 0

	return (
		<TouchableOpacity
			activeOpacity={onPress ? 0.7 : 1}
			disabled={!onPress}
			onPress={onPress}
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
				{typeof comment.score === 'number' && comment.score !== 0 ? (
					<Text style={styles.timestamp}>{` · ↑${comment.score}`}</Text>
				) : null}
				{hasReplies ? (
					<Text style={styles.collapseIndicator}>
						{isCollapsed ? ' ▶' : ' ▼'}
					</Text>
				) : null}
			</View>
			{!isCollapsed ? (
				<Text selectable={true} style={styles.body}>
					{body}
				</Text>
			) : null}
		</TouchableOpacity>
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
		backgroundColor: c.blue,
		paddingHorizontal: 5,
		paddingVertical: 2,
		marginLeft: 5,
		borderRadius: 3,
	},
	opBadgeText: {
		fontSize: 11,
		fontWeight: '700',
		color: c.white,
	},
	timestamp: {
		fontSize: 13,
		color: c.secondaryLabel,
	},
	collapseIndicator: {
		fontSize: 11,
		color: c.tertiaryLabel,
	},
	body: {
		fontSize: 14,
		color: c.bodyText,
		lineHeight: 20,
	},
})
