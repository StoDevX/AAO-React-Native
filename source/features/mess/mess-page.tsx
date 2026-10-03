import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {background, padding, refreshable} from '@expo/ui/swift-ui/modifiers'
import type {UseQueryResult} from '@tanstack/react-query'
import {PageLoading, PageNotice} from './page-notice'
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

/**
 * A page whose query has nothing to show yet: its error with Try Again, or a spinner while it
 * loads, or the offline line while it waits for a connection. Pull to refresh fetches it again.
 */
export function UnloadedPage({query}: {query: UseQueryResult<unknown>}): React.ReactNode {
	return (
		<MessPage onRefresh={() => query.refetch()}>
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
