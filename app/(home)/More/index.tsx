import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {Row} from '@frogpond/layout'
import {ListSeparator, ListSectionHeader, largeListProps, Title, ListRow} from '@frogpond/lists'
import {LinkValue} from '../../../source/features/more/types'

import {Stack} from 'expo-router'
import {filterLinkGroups} from '../../../source/features/more/helpers'
import {searchLinksOptions} from '../../../source/features/more/query'
import {useQuery} from '@tanstack/react-query'
import {SearchBar} from '../../../source/components/search-bar'

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	row: {
		marginVertical: 5,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

function MoreView(): React.ReactNode {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	let {data = [], error, refetch, isLoading, isError, isRefetching} = useQuery(searchLinksOptions)

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

	return (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />

			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={
					searchQuery ? (
						<NoticeView text={`No results found for "${searchQuery}"`} />
					) : isLoading ? (
						<LoadingView />
					) : (
						<NoticeView text="No results found." />
					)
				}
				contentContainerStyle={styles.contentContainer}
				contentInsetAdjustmentBehavior="automatic"
				keyExtractor={(item: LinkValue, index) => `${item.label}-${index}`}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="never"
				onRefresh={refetch}
				refreshing={isRefetching}
				renderItem={({item}) => {
					return (
						<ListRow arrowPosition="center" onPress={() => openUrl(item.url)}>
							<Row alignItems="center" style={styles.row}>
								<Title lines={2}>{item.label}</Title>
							</Row>
						</ListRow>
					)
				}}
				renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
				sections={filtered}
				style={styles.wrapper}
				{...largeListProps}
			/>
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
