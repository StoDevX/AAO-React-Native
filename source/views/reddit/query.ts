import {queryOptions} from '@tanstack/react-query'
import type {RedditCommentType, RedditPostType} from './types'
import {fetchRedditComments, fetchRedditPosts} from './reddit-api'

export const keys = {
	posts: (subreddit: string) => ['reddit', 'posts', subreddit] as const,
	comments: (postUrl: string) => ['reddit', 'comments', postUrl] as const,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditPostsOptions = (subreddit: string) =>
	queryOptions({
		queryKey: keys.posts(subreddit),
		queryFn: ({queryKey, signal}): Promise<RedditPostType[]> => {
			return fetchRedditPosts(queryKey[2], signal)
		},
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditCommentsOptions = (postUrl: string) =>
	queryOptions({
		queryKey: keys.comments(postUrl),
		queryFn: ({queryKey, signal}): Promise<RedditCommentType[]> => {
			return fetchRedditComments(queryKey[2], signal)
		},
	})
