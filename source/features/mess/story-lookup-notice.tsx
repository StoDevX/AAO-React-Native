import * as React from 'react'
import type {StyleProp, ViewStyle} from 'react-native'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import type {MessStoryLookup} from './use-mess-story'

type Props = {
	query: MessStoryLookup
	/** What to say when there is no such story, or nothing of it to show */
	unavailableText: string
	style?: StyleProp<ViewStyle>
	/** Set where the notice sits on a fixed backdrop, as the image viewer's black. */
	colorScheme?: 'light' | 'dark'
}

/** Stands in for a story that is loading, failed to load, or does not exist. */
export function StoryLookupNotice({
	query,
	unavailableText,
	style,
	colorScheme,
}: Props): React.ReactNode {
	if (query.isPending) {
		return <LoadingView colorScheme={colorScheme} style={style} />
	}
	if (query.isLoadingError) {
		return (
			<LoadErrorView
				colorScheme={colorScheme}
				error={query.error}
				onRetry={() => query.refetch()}
				style={style}
			/>
		)
	}
	return (
		<NoticeView
			colorScheme={colorScheme}
			style={style}
			systemImage="newspaper"
			title={unavailableText}
		/>
	)
}
