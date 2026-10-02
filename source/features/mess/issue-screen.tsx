import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {useQueryClient, type QueryClient} from '@tanstack/react-query'
import {IssuePage} from './issue-page'
import {IssueUnavailable} from './issue-unavailable'
import {issueDate} from './lib/issues'
import {messKeys} from './lib/keys'
import {MessPage, PAGE_MARGIN} from './mess-page'
import {useColumnWidth} from './use-column-width'
import {useMessIssue} from './use-mess-issues'

/**
 * Fetches the issue list again, then every issue on screen, for a page of an issue's pull to
 * refresh. The issue's stories are fetched by the ids the list gives it, so the list comes first:
 * a story added to the issue since it loaded gives the issue a new key, which fetches it. Every
 * loaded page is fetched again, since an older issue may sit on any of them.
 */
export async function refreshIssues(queryClient: QueryClient): Promise<void> {
	await queryClient.refetchQueries({queryKey: messKeys.issues})
	await queryClient.refetchQueries({queryKey: messKeys.anyIssue, type: 'active'})
}

/** One issue, opened from its tile, laid out as a front page, and titled with its date. */
export function IssueScreen({issueKey}: {issueKey: string}): React.ReactNode {
	let router = useRouter()
	let queryClient = useQueryClient()
	let columnWidth = useColumnWidth(PAGE_MARGIN)
	let {issue, persist, query} = useMessIssue(issueKey)

	if (!issue) {
		return <IssueUnavailable query={query} />
	}

	// "All ›" and a shelf's More tile list the section's stories from this issue, over this page.
	let showSection = (section: string) => {
		router.navigate({pathname: '/messenger/issue-section', params: {key: issueKey, section}})
	}

	return (
		<>
			{/* As on the front page, the paper runs behind a clear bar and the SwiftUI scroll view
			    still starts the issue below it. The bar keeps no title, since a titled bar draws
			    a hard edge once the page scrolls; the dateline names the issue, and the screen's
			    title is still what the Back button reads. */}
			<Stack.Screen
				options={{title: issueDate(issue.day), headerTitle: '', headerTransparent: true}}
			/>
			<MessPage onRefresh={() => refreshIssues(queryClient)}>
				<IssuePage
					columnWidth={columnWidth}
					issue={issue}
					onShowSection={showSection}
					// The newest issue is the front page's top tile, saved for the next launch; this
					// page shares its query.
					persist={persist}
				/>
			</MessPage>
		</>
	)
}
