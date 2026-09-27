import * as React from 'react'
import {useQuery} from '@tanstack/react-query'
import {PageLoading, PageNotice} from './page-notice'
import {messFeedOptions} from './query'
import {SectionStories} from './section-page'
import {StoryRows} from './story-list'

/** The paper's newest stories. */
function FeedStories(): React.ReactNode {
	let feed = useQuery(messFeedOptions)
	if (feed.data) return <StoryRows stories={feed.data} />
	if (feed.isError) return <PageNotice error={feed.error} onRetry={() => feed.refetch()} />
	return <PageLoading paused={feed.fetchStatus === 'paused'} />
}

/** Latest: every section's newest stories, or one section's. */
export function LatestPage({section}: {section: string | null}): React.ReactNode {
	return section ? <SectionStories name={section} /> : <FeedStories />
}
