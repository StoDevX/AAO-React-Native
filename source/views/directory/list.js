// @flow

import React from 'react'
import {StyleSheet, View, Text, Image, FlatList, Platform} from 'react-native'
import {SearchBar} from '@frogpond/searchbar'
import type {TopLevelViewPropsTypeWithParams} from '../types'
import {Column} from '@frogpond/layout'
import {ListRow, ListSeparator, Detail, Title} from '@frogpond/lists'
import {fetch} from '@frogpond/fetch'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {useAsync} from 'react-async'
import type {DirectoryItem, SearchResults} from './types'
import Icon from 'react-native-vector-icons/Ionicons'

type Props = TopLevelViewPropsTypeWithParams<{}>

class EmptySearchError extends Error {}
class TooShortSearchError extends Error {}

function searchDirectory(
	{query}: {query: string},
	{signal}: {signal: window.AbortController},
): Promise<SearchResults> {
	query = query.trim()

	if (!query) {
		throw new EmptySearchError()
	}

	if (query.length < 2) {
		throw new TooShortSearchError()
	}

	let url = 'https://www.stolaf.edu/directory/search'
	return fetch(url, {
		searchParams: {format: 'json', query: query},
		cache: 'no-store',
		signal: signal,
	}).json()
}

type ReactAsyncResult<T> = {
	data: ?T,
	error: ?Error,
	isLoading: boolean,
}

export function DirectoryView(props: Props) {
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 1000)

	let {data, error, isLoading}: ReactAsyncResult<SearchResults> = useAsync(
		searchDirectory,
		{query: searchQuery, watch: searchQuery},
	)

	let results = data ? data.results : []

	let renderRow = ({item}: {item: DirectoryItem}) => (
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
				textFieldBackgroundColor="white"
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
				<NoticeView text={`No results found for "${typedQuery}".`} />
			) : (
				<FlatList
					ItemSeparatorComponent={IndentedListSeparator}
					data={results.map((r, i) => ({...r, key: String(i)}))}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					renderItem={renderRow}
				/>
			)}
		</View>
	)
}
DirectoryView.navigationOptions = {
	title: 'Directory',
	headerBackTitle: 'Home',
}

function IndentedListSeparator() {
	return (
		<ListSeparator spacing={{left: leftMargin + imageSize + imageMargin}} />
	)
}

function NoSearchPerformed() {
	return (
		<View style={styles.emptySearch}>
			<Icon color={c.black} name="ios-search" size={54} />
			<Text style={styles.emptySearchText}>Search the Directory</Text>
		</View>
	)
}

type DirectoryItemRowProps = {
	item: DirectoryItem,
	onPress: () => mixed,
}

function IosDirectoryItemRow({item, onPress}: DirectoryItemRowProps) {
	return (
		<ListRow fullWidth={true} onPress={onPress} style={styles.row}>
			<Image source={{uri: item.thumbnail}} style={styles.image} />
			<Column flex={1}>
				<Title lines={1}>{item.displayName}</Title>
				<Detail lines={1}>{item.title}</Detail>
			</Column>
		</ListRow>
	)
}

function AndroidDirectoryItemRow({item, onPress}: DirectoryItemRowProps) {
	return (
		<ListRow fullWidth={true} onPress={onPress} style={styles.row}>
			<Image source={{uri: item.thumbnail}} style={styles.image} />
			<Column flex={1}>
				<Title lines={1}>{item.displayName}</Title>
				<Detail lines={1}>{item.title}</Detail>
			</Column>
		</ListRow>
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
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	image: {
		resizeMode: 'cover',
		width: imageSize,
		height: imageSize,
		borderRadius: imageSize / 2,
		marginRight: imageMargin,
		marginLeft: leftMargin,
	},
	emptySearch: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptySearchText: {
		fontSize: 18,
		color: c.black,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
})