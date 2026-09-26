import * as React from 'react'
import type {StyleProp, TextStyle, ViewStyle} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import type {MessStoryLookup} from './use-mess-story'

type Props = {
	query: MessStoryLookup
	/** What to say when there is no such story, or nothing of it to show */
	unavailableText: string
	style?: StyleProp<ViewStyle>
	textStyle?: StyleProp<TextStyle>
}

/** Stands in for a story that is loading, failed to load, or does not exist. */
export function StoryLookupNotice({
	query,
	unavailableText,
	style,
	textStyle,
}: Props): React.ReactNode {
	if (query.isPending) {
		return <NoticeView spinner={true} style={style} text="Loading…" textStyle={textStyle} />
	}
	if (query.isLoadingError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={() => query.refetch()}
				style={style}
				text={`A problem occurred while loading: ${query.error}`}
				textStyle={textStyle}
			/>
		)
	}
	return <NoticeView style={style} text={unavailableText} textStyle={textStyle} />
}
