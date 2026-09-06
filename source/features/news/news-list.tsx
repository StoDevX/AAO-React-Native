import * as React from 'react'
import {StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {ContentUnavailableView, Host, List, VStack} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import type {StoryType} from './types'
import {NewsRow} from './news-row'
import {filterByCategory} from './lib/util'
import {emptyStateProps} from './lib/empty-state'
import type {NewsFeedQuery} from './lib/combine'

type Props = {
	query: NewsFeedQuery
	/** The selected source's stories, cleaned by the same pass that built the picker's categories */
	entries: StoryType[]
	thumbnail: false | ImageResolvedAssetSource
	selectedCategory: string | null
}

export const NewsList = (props: Props): React.ReactNode => {
	let {error, refetch, isError, isLoading} = props.query
	let {entries, selectedCategory} = props

	let filteredEntries = React.useMemo(
		() => filterByCategory(entries, selectedCategory),
		[entries, selectedCategory],
	)

	let hasActiveFilter = selectedCategory !== null

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				<List
					modifiers={[
						listStyle('plain'),
						refreshable(async () => {
							await refetch()
						}),
					]}
				>
					{filteredEntries.length === 0 ? (
						<ContentUnavailableView systemImage="newspaper" {...emptyStateProps(hasActiveFilter)} />
					) : (
						filteredEntries.map((story, index) => (
							<NewsRow
								key={story.title}
								isLast={index === filteredEntries.length - 1}
								onPress={(url: string) => openUrl(url)}
								story={story}
								thumbnail={props.thumbnail}
							/>
						))
					)}
				</List>
			</VStack>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
})
