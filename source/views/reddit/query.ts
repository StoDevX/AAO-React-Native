import {client} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import type {RedditPostType, RedditCommentType} from './types'

export const keys = {
	posts: (subreddit: string) => ['reddit', 'posts', subreddit] as const,
	comments: (postUrl: string) => ['reddit', 'comments', postUrl] as const,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditPostsOptions = (subreddit: string) =>
	queryOptions({
		queryKey: keys.posts(subreddit),
		queryFn: async ({queryKey, signal}) => {
			const response = await client
				.get(`reddit/posts/${queryKey[2]}`, {signal})
				.json()
			return response as RedditPostType[]
		},
	})

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const redditCommentsOptions = (postUrl: string) =>
	queryOptions({
		queryKey: keys.comments(postUrl),
		queryFn: async ({queryKey, signal}) => {
			const response = await client
				.get('reddit/comments', {signal, searchParams: {url: queryKey[2]}})
				.json()
			return response as RedditCommentType[]
		},
	})
