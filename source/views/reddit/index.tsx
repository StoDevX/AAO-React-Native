import * as React from 'react'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import type {RedditPostType} from './types'
import {redditPostsOptions} from './query'
import {PostList} from './post-list'
import {useRedditPreferences} from './store'

export {PostDetailView} from './post-detail'

export function StOlafFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('stolaf'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'St. Olaf'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}

export function CarletonFeedScreen(): React.ReactNode {
	const router = useRouter()
	const {variant} = useRedditPreferences()
	const query = useQuery(redditPostsOptions('carletoncollege'))

	const handlePressPost = React.useCallback(
		(post: RedditPostType) => {
			router.push({
				pathname: '/RedditPostDetail',
				params: {postUrl: post.permalink, communityName: 'Carleton'},
			})
		},
		[router],
	)

	return (
		<PostList onPressPost={handlePressPost} query={query} variant={variant} />
	)
}
