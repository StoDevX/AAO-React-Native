import {queryOptions} from '@tanstack/react-query'
import type {RedditCommentType, RedditPostType} from './types'
import {fetchRedditComments, fetchRedditPost, fetchRedditPosts} from './reddit-api'

export const keys = {
	posts: (subreddit: string) => ['reddit', 'posts', subreddit] as const,
	post: (postUrl: string) => ['reddit', 'post', postUrl] as const,
	comments: (postUrl: string) => ['reddit', 'comments', postUrl] as const,
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const redditPostsOptions = (subreddit: string) =>
	queryOptions({
		queryKey: keys.posts(subreddit),
		queryFn: ({queryKey, signal}): Promise<RedditPostType[]> => {
			return fetchRedditPosts(queryKey[2], signal)
		},
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const redditPostByUrlOptions = (postUrl: string) =>
	queryOptions({
		queryKey: keys.post(postUrl),
		queryFn: ({queryKey, signal}) => fetchRedditPost(queryKey[2], signal),
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const redditCommentsOptions = (postUrl: string) =>
	queryOptions({
		queryKey: keys.comments(postUrl),
		queryFn: ({queryKey, signal}): Promise<RedditCommentType[]> => {
			return fetchRedditComments(queryKey[2], signal)
		},
	})
