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
import {Column} from '@frogpond/layout'
import {ListRow, ListSeparator, Detail, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {formatResults} from './helpers'
import {useFetch} from 'react-async'
import {List, Avatar} from 'react-native-paper'
import type {
	DirectorySearchTypeEnum,
	DirectoryItem,
	SearchResults,
} from './types'
import Icon from 'react-native-vector-icons/Ionicons'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {ChangeTextEvent, RootStackParamList} from '../../navigation/types'

const getDirectoryUrl = (query: string, type: DirectorySearchTypeEnum) => {
	let baseUrl = 'https://www.stolaf.edu/directory/search?format=json'

	switch (type) {
		case 'Query':
			return `${baseUrl}&query=${query.trim()}`
		case 'Department': {
			let formattedDepartment = query.split(' ').join('+')
			return `${baseUrl}&department=${formattedDepartment}`
		}
		default:
			console.warn(
				'Unknown directory search type found when constructing directory url.',
			)
			return `${baseUrl}&query=${query.trim()}`
	}
}

const useDirectory = (query: string, type: DirectorySearchTypeEnum) => {
	const url = getDirectoryUrl(query, type)

	return useFetch<SearchResults>(url, {
		headers: {accept: 'application/json'},
	})
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Directory',
}

export function DirectoryView(): JSX.Element {
	let [errorMessage, setErrorMessage] = React.useState<string | null>(null)
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 500)

	let navigation = useNavigation()

	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {params} = route

	let {
		data: {results = []} = {},
		error,
		reload,
		isPending,
		isInitial,
		isLoading,
	} = useDirectory(searchQuery, params?.queryType ?? 'Query')

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				barTintColor: c.white,
				onChangeText: (event: ChangeTextEvent) =>
					setTypedQuery(event.nativeEvent.text),
			},
		})
	}, [navigation])

	React.useEffect(() => {
		if (error) {
			setErrorMessage(getErrorMessage(error))
		}
	}, [error])

	React.useEffect(() => {
		if (params?.queryType === 'Department' && params?.queryParam) {
			setTypedQuery(params.queryParam)
		}
	}, [params])

	if (!searchQuery) {
		return <NoSearchPerformed />
	}

	if (searchQuery.length < 2) {
		return <NoticeView text="Your search is too short." />
	}

	const items = results ? formatResults(results) : []

	const renderRow = ({item}: {item: DirectoryItem}) => (
		<DirectoryItemRow
			item={item}
			onPress={() => {
				navigation.push('DirectoryDetail', {contact: item})
			}}
		/>
	)

	return (
		<View style={styles.wrapper}>
			{isLoading ? (
				<LoadingView />
			) : errorMessage ? (
				<NoticeView text={parseErrorMessage(errorMessage)} />
			) : !items.length ? (
				<NoticeView text={`No results found for "${searchQuery}".`} />
			) : (
				<FlatList
					ItemSeparatorComponent={IndentedListSeparator}
					contentInsetAdjustmentBehavior="automatic"
					data={items.map((r: DirectoryItem, i: number) => ({
						...r,
						key: String(i),
					}))}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					onRefresh={reload}
					refreshing={isPending && !isInitial}
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
			<Icon
				color={c.semitransparentGray}
				name="people-circle-outline"
				size={64}
			/>
			<Text style={styles.emptySearchText}>Search the Directory</Text>
		</View>
	)
}

type DirectoryItemRowProps = {
	item: DirectoryItem
	onPress: () => void
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

const DIRECTORY_HTML_ERROR_CODE = 'directory-html'

const getErrorMessage = (error: Error | undefined) => {
	if (!(error instanceof Error)) {
		return 'Unknown Error: Not an Error'
	}

	if (error.message === "JSON Parse error: Unrecognized token '<'") {
		return DIRECTORY_HTML_ERROR_CODE
	} else {
		return error.message
	}
}

const parseErrorMessage = (errorMessage: string) => {
	let message = `Error: ${errorMessage}`
	if (errorMessage === DIRECTORY_HTML_ERROR_CODE) {
		message =
			'Something between you and the directory is having problems. Try again in a minute or two?'
	}
	return message
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
