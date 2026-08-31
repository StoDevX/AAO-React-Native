import * as React from 'react'
import {StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {
	ContentUnavailableView,
	Host,
	List,
	ProgressView,
	RNHostView,
	VStack,
} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import type {StoryType} from './types'
import {NewsRow} from './news-row'
import {cleanEntries, trimStoryCateogry} from './lib/util'
import {emptyStateProps} from './lib/empty-state'
import {FilterToolbar, ListType, selectedOptions} from '@frogpond/filter'
import {UseQueryResult} from '@tanstack/react-query'

type Props = {
	query: UseQueryResult<StoryType[]>
	thumbnail: false | ImageResolvedAssetSource
}

let getStoryCategories = (story: StoryType) => {
	return story.categories.map((category) => trimStoryCateogry(category))
}

let filterStories = (entries: StoryType[], filters: ListType<StoryType>[]) => {
	return entries.filter((story) => {
		let enabledCategories = filters.flatMap((f: ListType<StoryType>) =>
			f.spec.selected.flatMap((s) => s.title),
		)

		if (enabledCategories.length === 0) {
			return entries
		}

		return getStoryCategories(story).some((category) => enabledCategories.includes(category))
	})
}

export const NewsList = (props: Props): React.ReactNode => {
	let {data = [], error, refetch, isRefetching: _isRefetching, isError, isLoading} = props.query

	let entries = React.useMemo(() => cleanEntries(data), [data])

	// Only the narrowing the user asked for is state; the categories on offer
	// come from the feed. Keeping the whole filter in state instead would tie
	// the reader's choice to the story list, so a refetch that brought new
	// stories would carry an everything-selected filter in with them.
	let [chosenCategories, setChosenCategories] = React.useState<string[] | null>(null)

	let filters = React.useMemo((): ListType<StoryType>[] => {
		let allCategories = entries.flatMap((story) => getStoryCategories(story))

		if (allCategories.length === 0) {
			return []
		}

		let options = [...new Set(allCategories)].sort().map((category) => ({title: category}))
		let selected = selectedOptions(options, chosenCategories)

		return [
			{
				type: 'list',
				key: 'category',
				// Selecting nothing is the resting state and shows everything --
				// the invariant modules/filter/lib/select-options.ts applies on
				// every subsequent edit.
				enabled: selected.length > 0,
				spec: {
					title: 'Categories',
					options,
					selected,
					// A pull-down however many categories the feed happens to carry.
					presentation: 'menu',
					mode: 'OR',
					displayTitle: true,
				},
				apply: {key: 'categories'},
			},
		]
	}, [entries, chosenCategories])

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	let filteredEntries = filterStories(entries, filters)
	let hasActiveFilter = filters.some((f) => f.spec.selected.length)

	return (
		<Host style={styles.host}>
			<VStack spacing={0}>
				{/* The filter toolbar this carries is React Native, so it still
				    needs an `RNHostView` bridge into the SwiftUI tree around it. */}
				<RNHostView matchContents={true}>
					<FilterToolbar
						filters={filters}
						onChange={(newFilter) => {
							// The categories list is the only filter this toolbar carries.
							if (newFilter.type !== 'list') {
								return
							}
							setChosenCategories(newFilter.spec.selected.map((option) => option.title))
						}}
					/>
				</RNHostView>

				<List
					modifiers={[
						listStyle('plain'),
						refreshable(async () => {
							await refetch()
						}),
					]}
				>
					{isLoading ? (
						<ProgressView />
					) : filteredEntries.length === 0 ? (
						<ContentUnavailableView systemImage="newspaper" {...emptyStateProps(hasActiveFilter)} />
					) : (
						filteredEntries.map((story) => (
							<NewsRow
								key={story.title}
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
