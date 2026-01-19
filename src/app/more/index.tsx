import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {Row} from '@frogpond/layout'
import {
	ListSeparator,
	ListSectionHeader,
	largeListProps,
	Title,
	ListRow,
} from '@frogpond/lists'
import {Stack} from 'expo-router'
import {deburr, words} from 'lodash'
import {useSearchLinks, type LinkValue} from '../../views/more/query'

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

function splitToArray(str: string) {
	return words(deburr(str.toLowerCase()))
}

function linkToArray(data: LinkValue) {
	return Array.from(new Set(splitToArray(data.label)))
}

export default function MoreView(): React.JSX.Element {
	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query.toLowerCase(), 200)

	let {
		data = [],
		error,
		refetch,
		isLoading,
		isError,
		isRefetching,
	} = useSearchLinks()

	let filtered = React.useMemo(() => {
		let filteredData = []
		for (let {title, data: items} of data) {
			let filteredItems = items.filter((value) =>
				linkToArray(value).some((item) => item.includes(searchQuery)),
			)
			if (filteredItems.length) {
				filteredData.push({title, data: filteredItems})
			}
		}
		return filteredData
	}, [data, searchQuery])

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
			<Stack.Screen
				options={{
					title: 'More',
					headerSearchBarOptions: {
						onChangeText: (event) => setQuery(event.nativeEvent.text),
					},
				}}
			/>

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
				renderSectionHeader={({section: {title}}) => (
					<ListSectionHeader title={title} />
				)}
				sections={filtered}
				style={styles.wrapper}
				{...largeListProps}
			/>
		</>
	)
}
