import * as React from 'react'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import type {RedditPostType} from '../../../source/features/reddit/types'
import {redditPostsOptions} from '../../../source/features/reddit/query'
import {PostList} from '../../../source/features/reddit/post-list'
import {useRedditPreferences} from '../../../source/features/reddit/store'

export default function CarletonFeedPage(): React.ReactNode {
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

	return <PostList onPressPost={handlePressPost} query={query} variant={variant} />
}
