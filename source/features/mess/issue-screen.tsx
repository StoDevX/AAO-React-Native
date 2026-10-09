import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {useQueryClient, type QueryClient} from '@tanstack/react-query'
import {IssuePage} from './issue-page'
import {IssueUnavailable} from './issue-unavailable'
import {issueDate, issueName} from './lib/issues'
import {paperKeys} from './lib/keys'
import type {Paper} from './campus-section'
import {usePaper} from './paper-context'
import {MessPage, PAGE_MARGIN, PAPER_BAR, PaperTitle} from './mess-page'
import {useColumnWidth} from './use-column-width'
import {useMessIssue} from './use-mess-issues'

/**
 * Fetches the issue list again, then every issue on screen, for a page of an issue's pull to
 * refresh. The issue's stories are fetched by the ids the list gives it, so the list comes first:
 * a story added to the issue since it loaded gives the issue a new key, which fetches it. Every
 * loaded page is fetched again, since an older issue may sit on any of them.
 */
export async function refreshIssues(queryClient: QueryClient, paper: Paper): Promise<void> {
	let keys = paperKeys(paper.id)
	await queryClient.refetchQueries({queryKey: keys.issues})
	await queryClient.refetchQueries({queryKey: keys.anyIssue, type: 'active'})
}

/** One issue, opened from its tile, laid out as a front page, and titled with its date. */
export function IssueScreen({issueKey}: {issueKey: string}): React.ReactNode {
	let router = useRouter()
	let paper = usePaper()
	let queryClient = useQueryClient()
	let columnWidth = useColumnWidth(PAGE_MARGIN)
	let {issue, persist, query} = useMessIssue(issueKey)

	if (!issue) {
		return <IssueUnavailable query={query} />
	}

	// "All ›" and a shelf's More tile list the section's stories from this issue, over this page.
	let showSection = (section: string) => {
		router.navigate({pathname: paper.routes.issueSection, params: {key: issueKey, section}})
	}

	return (
		<>
			{/* The Back button on a page opened from here reads the issue's date. */}
			<Stack.Screen options={PAPER_BAR} />
			<PaperTitle
				backTitle={issueDate(issue.day)}
				subtitle={issueName(issue)}
				title={paper.title}
			/>
			<MessPage onRefresh={() => refreshIssues(queryClient, paper)}>
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
