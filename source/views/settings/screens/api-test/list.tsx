import React from 'react'
import {View, SectionList, StyleSheet} from 'react-native'
import {ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {debounceSearch} from '@frogpond/use-debounce'
import {NetworkLoggerButton} from '@frogpond/navigation-buttons'

import {ServerRoute, serverRoutesOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {ChangeTextEvent} from '../../../../navigation/types'
import {useNavigation, useRouter} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const APITestView = (): React.ReactNode => {
	let navigation = useNavigation()
	let router = useRouter()

	let [filterPath, setFilterPath] = React.useState<string>('')

	let {
		data: groupedRoutes = [],
		error: routesError,
		isLoading: isRoutesLoading,
		isError: isRoutesError,
		refetch: routesRefetch,
	} = useQuery(serverRoutesOptions)

	React.useLayoutEffect(() => {
		const rightButton = () => <NetworkLoggerButton />
		navigation.setOptions({
			headerSearchBarOptions: {
				autoCapitalize: 'none',
				barTintColor: c.systemFill,
				// android-only
				autoFocus: true,
				hideNavigationBar: false,
				hideWhenScrolling: false,
				onChangeText: (event: ChangeTextEvent) =>
					setFilterPath(event.nativeEvent.text),
				placeholder: '/path/to/uri',
			},
			headerRight: rightButton,
		})
	}, [navigation])

	let showSearchResult = React.useCallback(() => {
		router.push({
			pathname: '/APITestDetail',
			params: {displayName: filterPath},
		})
	}, [filterPath, router])

	React.useEffect(() => {
		debounceSearch(filterPath, () => showSearchResult())
	}, [filterPath, navigation, showSearchResult])

	const renderItem = React.useCallback(
		(item: ServerRoute) => (
			<ListRow
				fullWidth={false}
				onPress={() =>
					router.push({
						pathname: '/APITestDetail',
						params: {displayName: item.displayName},
					})
				}
				style={styles.serverRouteRow}
			>
				<Column flex={1}>
					<Title lines={1}>{item.displayName}</Title>
				</Column>
			</ListRow>
		),
		[router],
	)

	return (
		<View style={styles.serverRouteContainer}>
			{isRoutesLoading ? (
				<LoadingView />
			) : isRoutesError && routesError instanceof Error ? (
				<NoticeView
					buttonText="Try Again"
					onPress={routesRefetch}
					text={`A problem occured while loading: ${routesError}`}
				/>
			) : !groupedRoutes ? (
				<NoticeView text="No routes were found." />
			) : (
				<SectionList
					ItemSeparatorComponent={ListSeparator}
					contentInsetAdjustmentBehavior="automatic"
					keyExtractor={(item, index) => `${item.path}-${index}`}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					onRefresh={routesRefetch}
					refreshing={isRoutesLoading}
					renderItem={({item}) => renderItem(item)}
					renderSectionHeader={({section: {title}}) => (
						<ListSectionHeader title={title} />
					)}
					sections={groupedRoutes}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	serverRouteContainer: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	serverRouteRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'API Tester',
}
