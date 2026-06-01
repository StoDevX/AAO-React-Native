import * as React from 'react'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {openUrl} from '@frogpond/open-url'
import type {RootStackParamList} from '../../navigation/types'
import {fetchRedditPost} from './reddit-api'

/**
 * Matches Reddit post URLs across www, old, and bare reddit.com domains.
 * Extracts the subreddit name for use as the communityName.
 */
function parseRedditPostUrl(
	url: string,
): {postUrl: string; subreddit: string} | null {
	try {
		const parsed = new URL(url)
		if (!/(^|\.)reddit\.com$/u.test(parsed.hostname)) return null
		const match = /^\/r\/([^/]+)\/comments\/[^/]+/u.exec(parsed.pathname)
		if (!match) return null
		return {
			postUrl: `https://www.reddit.com${parsed.pathname}`,
			subreddit: match[1],
		}
	} catch {
		return null
	}
}

/**
 * Returns a link-press handler for use in Reddit post body and comments.
 * If the URL is a Reddit post, fetches the post data and pushes a new
 * PostDetailView onto the stack. Otherwise falls back to openUrl.
 *
 * Each call cancels any in-flight request (double-tap guard). The controller
 * is also aborted on unmount so a pending fetch never triggers navigation
 * after the screen is gone.
 */
export function useRedditLinkHandler(): (url: string) => void {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const controllerRef = React.useRef<AbortController | null>(null)

	React.useEffect(() => {
		return () => {
			controllerRef.current?.abort()
		}
	}, [])

	return React.useCallback(
		async (url: string) => {
			const redditMatch = parseRedditPostUrl(url)
			if (!redditMatch) {
				openUrl(url)
				return
			}

			// Cancel any previous in-flight fetch before starting a new one
			controllerRef.current?.abort()
			const controller = new AbortController()
			controllerRef.current = controller

			try {
				const post = await fetchRedditPost(
					redditMatch.postUrl,
					controller.signal,
				)
				if (controller.signal.aborted) return
				if (!post) {
					openUrl(url)
					return
				}
				navigation.push('RedditPostDetail', {
					postUrl: post.permalink,
					title: post.title,
					author: post.author,
					publishedAt: post.publishedAt,
					contentHtml: post.contentHtml,
					thumbnail: post.thumbnail,
					communityName: `r/${redditMatch.subreddit}`,
					postAuthor: post.author,
					postType: post.postType,
					imageUrl: post.imageUrl,
					images: post.images,
					linkUrl: post.linkUrl,
					linkDomain: post.linkDomain,
					crosspostParent: post.crosspostParent,
					pollData: post.pollData,
				})
			} catch {
				if (!controller.signal.aborted) {
					openUrl(url)
				}
			}
		},
		[navigation],
	)
}
