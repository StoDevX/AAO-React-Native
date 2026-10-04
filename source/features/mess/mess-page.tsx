import * as React from 'react'
import {StyleSheet, type ColorValue} from 'react-native'
import {Host, LazyVStack, ScrollView} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	lineLimit,
	minimumScaleFactor,
	padding,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import type {UseQueryResult} from '@tanstack/react-query'
import {NavigationTitle} from '../../components/navigation-title'
import {PageLoading, PageNotice} from './page-notice'
import {ink, paper} from './palette'

/** The side margin of a Mess page's column. */
export const PAGE_MARGIN = 20

const COLUMN = [padding({horizontal: PAGE_MARGIN, vertical: 16})]

/**
 * A Mess screen's navigation bar, set on the paper so a page scrolling under it does not show
 * through, and with no rule under it, which a printed page does not have.
 */
export const PAPER_BAR = {
	headerTransparent: false,
	headerShadowVisible: false,
	headerStyle: {backgroundColor: paper},
} as const

type Props = {
	/** Fetches the page's stories again, for pull to refresh */
	onRefresh: () => Promise<unknown>
	/** The page's colour; the paper by default, or the system's for a page that loads into a list or grid */
	color?: ColorValue
	children: React.ReactNode
}

/**
 * A Mess title's first line, in the serif the paper is set in, bold as its nameplate was, and a
 * size up from the system's headline. It shrinks rather than wraps, as any title in a bar of fixed
 * height must.
 */
const PAPER_TITLE = [
	font({textStyle: 'title3', design: 'serif', weight: 'bold'}),
	foregroundStyle(ink),
	lineLimit(1),
	minimumScaleFactor(0.75),
]

/** A Mess screen's two-line title, its first line set in the paper's type. */
export function PaperTitle(
	props: Omit<React.ComponentProps<typeof NavigationTitle>, 'titleModifiers'>,
): React.ReactNode {
	return <NavigationTitle {...props} titleModifiers={PAPER_TITLE} />
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
