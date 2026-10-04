import * as React from 'react'
import {StyleSheet, type ColorValue} from 'react-native'
import {Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {background, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import type {UseQueryResult} from '@tanstack/react-query'
import {PageLoading, PageNotice} from './page-notice'
import {paper} from './palette'

/** The side margin of a Mess page's column. */
export const PAGE_MARGIN = 20

const COLUMN = [padding({horizontal: PAGE_MARGIN, vertical: 16})]

type Props = {
	/** Fetches the page's stories again, for pull to refresh */
	onRefresh: () => Promise<unknown>
	/** The page's colour; the paper by default, or the system's for a page that loads into a list or grid */
	color?: ColorValue
	children: React.ReactNode
}

/** A Mess page on the paper: a column that scrolls, with pull to refresh. */
export function MessPage({onRefresh, color = paper, children}: Props): React.ReactNode {
	return (
		<Host style={styles.page}>
			<ScrollView
				modifiers={[
					background(color),
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

/**
 * A page whose query has nothing to show yet: its error with Try Again, or a spinner while it
 * loads, or the offline line while it waits for a connection. Pull to refresh fetches it again.
 * It takes the colour of the page it stands in for, so the page does not change colour on load.
 */
export function UnloadedPage({
	query,
	color,
}: {
	query: UseQueryResult<unknown>
	color?: ColorValue
}): React.ReactNode {
	return (
		<MessPage color={color} onRefresh={() => query.refetch()}>
			{query.isError ? (
				<PageNotice error={query.error} onRetry={() => query.refetch()} />
			) : (
				<PageLoading paused={query.fetchStatus === 'paused'} />
			)}
		</MessPage>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
})
