import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'

import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'

import {Stack} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {DisclosureRow} from '../../../source/components/rows'
import {SearchBar} from '../../../source/components/search-bar'
import {filterLinkGroups} from '../../../source/features/more/helpers'
import {searchLinksOptions} from '../../../source/features/more/query'

function MoreView(): React.ReactNode {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	let {data = [], error, refetch, isLoading, isError} = useQuery(searchLinksOptions)

	let filtered = React.useMemo(() => filterLinkGroups(data, searchQuery), [data, searchQuery])

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />

			<Host style={styles.host}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						refreshable(async () => {
							await refetch()
						}),
					]}
				>
					{filtered.length === 0 ? (
						<ContentUnavailableView
							systemImage="magnifyingglass"
							title={searchQuery ? `No results found for "${searchQuery}"` : 'No results found.'}
						/>
					) : (
						filtered.map((section) => (
							<Section key={section.title} title={section.title}>
								{section.data.map((link, index) => (
									<DisclosureRow
										key={`${link.label}-${index}`}
										onPress={() => openUrl(link.url)}
										title={link.label}
										titleLines={2}
									/>
								))}
							</Section>
						))
					)}
				</List>
			</Host>
		</>
	)
}

export default function MorePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>More</Stack.Title>
			<MoreView />
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
