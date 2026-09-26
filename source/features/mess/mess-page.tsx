import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, LazyVStack, ScrollView, VStack} from '@expo/ui/swift-ui'
import {background, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import {paper} from './palette'

/** The side margin of a Mess page's column. */
export const PAGE_MARGIN = 20

const PAPER = [background(paper)]
const COLUMN = [padding({horizontal: PAGE_MARGIN, vertical: 16})]

type Props = {
	/** Drawn above the page, where it stays while the page scrolls: the front page's chips */
	pinned?: React.ReactNode
	/** Fetches the page's stories again, for pull to refresh */
	onRefresh: () => Promise<unknown>
	children: React.ReactNode
}

/**
 * A Mess page on the paper: anything pinned, then a column that scrolls, with pull to refresh.
 * The pinned row sits inside the SwiftUI stack rather than beside the host, so SwiftUI lays it
 * out below the navigation bar instead of under it.
 */
export function MessPage({pinned, onRefresh, children}: Props): React.ReactNode {
	return (
		<Host style={styles.page}>
			<VStack modifiers={PAPER} spacing={0}>
				{pinned}
				<ScrollView
					modifiers={[
						...PAPER,
						refreshable(async () => {
							await onRefresh()
						}),
					]}
				>
					<LazyVStack alignment="leading" modifiers={COLUMN} spacing={14}>
						{children}
					</LazyVStack>
				</ScrollView>
			</VStack>
		</Host>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
