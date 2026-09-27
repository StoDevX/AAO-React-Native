import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {background, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import {paper} from './palette'

/** The side margin of a Mess page's column. */
export const PAGE_MARGIN = 20

const PAPER = [background(paper)]
const COLUMN = [padding({horizontal: PAGE_MARGIN, vertical: 16})]

type Props = {
	/** Fetches the page's stories again, for pull to refresh */
	onRefresh: () => Promise<unknown>
	children: React.ReactNode
}

/** A Mess page on the paper: a column that scrolls, with pull to refresh. */
export function MessPage({onRefresh, children}: Props): React.ReactNode {
	return (
		<Host style={styles.page}>
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
		</Host>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
