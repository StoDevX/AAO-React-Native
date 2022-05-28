import React from 'react'
import {
	StyleSheet,
	View,
	Text,
	Image,
	FlatList,
	Platform,
	SafeAreaView,
} from 'react-native'
import {SearchBar} from '@frogpond/searchbar'
import {Column} from '@frogpond/layout'
import {ListRow, ListSeparator, Detail, Title} from '@frogpond/lists'
import {fetch} from '@frogpond/fetch'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {formatResults} from './helpers'
import {AsyncState, useAsync} from 'react-async'
import {List, Avatar} from 'react-native-paper'
import type {DirectoryItem, SearchResults} from './types'
import type {TopLevelViewPropsTypeWithParams} from '../types'
import {AnyObject} from '../../views/types'
import Icon from 'react-native-vector-icons/Ionicons'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

type Props = TopLevelViewPropsTypeWithParams<AnyObject>

class EmptySearchError extends Error {}
class TooShortSearchError extends Error {}

function searchDirectory(
	{query}: {query: string},
	{signal}: {signal: window.AbortController},
): Promise<SearchResults> {
	query = query.trim()
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Directory',
}

	if (!query) {
		throw new EmptySearchError()
	}

	if (query.length < 2) {
		throw new TooShortSearchError()
	}

	const url = 'https://www.stolaf.edu/directory/search'
	return fetch(url, {
		searchParams: {format: 'json', query: query},
		cache: 'no-store',
		signal: signal,
	}).json()
}

export function DirectoryView(props: Props): JSX.Element {
	const [typedQuery, setTypedQuery] = React.useState('')
	const searchQuery = useDebounce(typedQuery, 500)

	const {data, error, isLoading}: AsyncState<SearchResults> = useAsync(
		searchDirectory,
		{query: searchQuery, watch: searchQuery},
	)

	const results = data ? formatResults(data) : []

	const renderRow = ({item}: {item: DirectoryItem}) => (
		<DirectoryItemRow
			item={item}
			onPress={() => {
				props.navigation.navigate('DirectoryDetailView', {contact: item})
			}}
		/>
	)

	return (
		<View style={styles.wrapper}>
			<SearchBar
				onChange={setTypedQuery}
				style={styles.search}
				value={typedQuery}
			/>

			{isLoading ? (
				<LoadingView />
			) : error instanceof EmptySearchError ? (
				<NoSearchPerformed />
			) : error instanceof TooShortSearchError ? (
				<NoticeView text="Your search is too short." />
			) : error ? (
				<NoticeView text="There was an error. Please try again." />
			) : !results.length ? (
				<NoticeView text={`No results found for "${searchQuery}".`} />
			) : (
				<FlatList
					ItemSeparatorComponent={IndentedListSeparator}
					data={results.map((r: DirectoryItem, i: number) => ({
						...r,
						key: String(i),
					}))}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					renderItem={renderRow}
				/>
			)}
		</View>
	)
}

function IndentedListSeparator() {
	return (
		<ListSeparator spacing={{left: leftMargin + imageSize + imageMargin}} />
	)
}

function NoSearchPerformed() {
	return (
		<View style={styles.emptySearch}>
			<Icon color={c.semitransparentGray} name="ios-search" size={54} />
			<Text style={styles.emptySearchText}>Search the Directory</Text>
		</View>
	)
}

type DirectoryItemRowProps = {
	item: DirectoryItem
	onPress: () => mixed
}

function IosDirectoryItemRow({item, onPress}: DirectoryItemRowProps) {
	return (
		<SafeAreaView>
			<ListRow fullWidth={true} onPress={onPress} style={styles.row}>
				<Image source={{uri: item.thumbnail}} style={styles.image} />
				<Column flex={1}>
					<Title lines={1}>{item.displayName}</Title>
					<Detail lines={1}>{item.description}</Detail>
				</Column>
			</ListRow>
		</SafeAreaView>
	)
}

function AndroidDirectoryItemRow({item, onPress}: DirectoryItemRowProps) {
	return (
		<List.Item
			description={item.description}
			left={(props) => (
				<Avatar.Image
					{...props}
					size={42}
					source={{uri: item.thumbnail}}
					style={[props.style, styles.image]}
				/>
			)}
			onPress={onPress}
			title={item.displayName}
		/>
	)
}

const DirectoryItemRow =
	Platform.OS === 'ios' ? IosDirectoryItemRow : AndroidDirectoryItemRow

const leftMargin = 15
const imageSize = 35
const imageMargin = 10
const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: c.white,
	},
	search: Platform.OS === 'ios' ? {} : {margin: 8},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	image:
		Platform.OS === 'ios'
			? {
					resizeMode: 'cover',
					width: imageSize,
					height: imageSize,
					borderRadius: 4,
					marginRight: imageMargin,
					marginLeft: leftMargin,
			  }
			: {
					alignSelf: 'center',
					marginHorizontal: 8,
			  },
	emptySearch: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptySearchText: {
		fontSize: 18,
		color: c.semitransparentGray,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
})
