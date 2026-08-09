import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {PostDetailView} from '../../source/views/reddit'
import {redditPostByUrlOptions} from '../../source/views/reddit/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function RedditPostDetailPage(): React.ReactNode {
	let {postUrl, communityName} = useLocalSearchParams<{
		postUrl: string
		communityName: string
	}>()

	let {
		data: post,
		isLoading,
		error,
		refetch,
	} = useQuery(redditPostByUrlOptions(postUrl))

	let screen = <Stack.Screen options={{title: communityName}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!post) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this post." />
			</>
		)
	}

	return (
		<>
			{screen}
			<PostDetailView communityName={communityName} post={post} />
		</>
	)
}
