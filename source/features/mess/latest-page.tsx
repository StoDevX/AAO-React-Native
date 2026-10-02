import * as React from 'react'
import {useInfiniteQuery} from '@tanstack/react-query'
import {messFeedOptions} from './query'
import {SectionStories} from './section-page'
import {PagedStoryRows} from './story-list'

/** The paper's newest stories. */
function FeedStories(): React.ReactNode {
	return <PagedStoryRows query={useInfiniteQuery(messFeedOptions)} />
}

/** Latest: every section's newest stories, or one section's. */
export function LatestPage({section}: {section: string | null}): React.ReactNode {
	return section ? <SectionStories name={section} /> : <FeedStories />
}
