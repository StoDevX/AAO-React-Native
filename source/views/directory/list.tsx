import React from 'react'
import {
	FlatList,
	Image,
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import {Column} from '@frogpond/layout'
import {Detail, ListRow, ListSeparator, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {formatResults} from './helpers'
import {useDirectoryEntries} from './query'
import {Avatar, List} from 'react-native-paper'
import type {
	DirectoryIconProps,
	DirectoryItem,
	DirectorySearchTypeEnum,
} from './types'
import Icon from 'react-native-vector-icons/Ionicons'
import {RouteProp, useNavigation, useRoute} from 'expo-router'
import {
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from 'expo-router-stack'
import {ChangeTextEvent, RootStackParamList} from '../../navigation/types'

export const NavigationKey = 'Directory'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {params} = props.route
	return {
		title: params?.queryParam ?? 'Directory',
	}
}

export function DirectoryView(): React.JSX.Element {
	let [searchQueryType, setSearchQueryType] =
		React.useState<DirectorySearchTypeEnum>('query')
	let [typedQuery, setTypedQuery] = React.useState('')
	let searchQuery = useDebounce(typedQuery, 500)

	// typing useNavigation's props to inform typescript about `push`
	let navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	let {params} = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()

	let {
		data = {results: []},
		error,
		refetch,
		isError,
		isRefetching,
		isLoading,
	} = useDirectoryEntries(searchQuery, searchQueryType)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerSearchBarOptions: {
				// forcibly pretend that OpaqueColorValue is a string
				barTintColor: c.systemFill as unknown as string,
				onChangeText: (event: ChangeTextEvent) => {
					setSearchQueryType('query')
					setTypedQuery(event.nativeEvent.text)
				},
			},
		})
	}, [navigation])

	React.useEffect(() => {
		if (params?.queryType === 'department' && params.queryParam) {
			setSearchQueryType('department')
			setTypedQuery(params.queryParam)
		}
	}, [params?.queryType, params?.queryParam])

	if (!searchQuery) {
		return <NoSearchPerformed />
	}

	if (searchQuery.length < 2) {
		return <NoticeView text="Your search is too short." />
	}

	const items = data.results ? formatResults(data.results) : []

	return (
		<View style={styles.wrapper}>
			{isLoading ? (
				<LoadingView />
			) : isError && error instanceof Error ? (
				<NoticeView text={String(error)} />
			) : !items.length ? (
				<NoticeView text={`No results found for "${searchQuery}".`} />
			) : (
				<FlatList
					ItemSeparatorComponent={IndentedListSeparator}
					contentInsetAdjustmentBehavior="automatic"
					data={items}
					keyExtractor={(_item, index) => String(index)}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					onRefresh={refetch}
					refreshing={isRefetching}
					renderItem={({item}) => (
						<DirectoryItemRow
							item={item}
							onPress={() => {
								navigation.push('DirectoryDetail', {contact: item})
							}}
						/>
					)}
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
			<Icon color={c.secondaryLabel} name="people-circle-outline" size={64} />
			<Text style={styles.emptySearchText}>Search the Directory</Text>
		</View>
	)
}

interface DirectoryItemRowProps {
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
	const renderAvatar = (props: DirectoryIconProps) => {
		return (
			<Avatar.Image
				{...props}
				size={42}
				source={{uri: item.thumbnail}}
				style={[props.style, styles.image]}
			/>
		)
	}

	return (
		<List.Item
			description={item.description}
			left={renderAvatar}
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
		backgroundColor: c.systemBackground,
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
		color: c.secondaryLabel,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
})
