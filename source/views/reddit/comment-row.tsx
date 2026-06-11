import * as React from 'react'
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native'
import {formatDistanceToNow, parseISO, isValid} from 'date-fns'
import * as c from '@frogpond/colors'
import {htmlToSegments} from '@frogpond/html-lib'
import type {RedditCommentType} from './types'
import {SegmentedText} from './segmented-text'

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
	onLinkPress?: (url: string) => void
	testID?: string
}

export function CommentRow({
	comment,
	depth = 0,
	isOP = false,
	isCollapsed = false,
	onPress,
	onLinkPress,
	testID,
}: Props): React.ReactNode {
	const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]
	const segments = htmlToSegments(comment.contentHtml)
	const parsedDate = parseISO(comment.publishedAt)
	const relativeTime = isValid(parsedDate)
		? formatDistanceToNow(parsedDate, {addSuffix: true})
		: ''
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
				<SegmentedText
					onLinkPress={onLinkPress}
					segments={segments}
					style={styles.body}
				/>
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
		paddingHorizontal: 3,
		paddingVertical: 2,
		marginLeft: 3,
	},
	opBadgeText: {
		fontSize: 13,
		fontWeight: '700',
		color: c.blue,
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
