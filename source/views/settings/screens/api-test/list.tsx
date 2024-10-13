import React from 'react'
import {View, SectionList, SafeAreaView, StyleSheet} from 'react-native'

import {ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {debounceSearch} from '@frogpond/use-debounce'
import {NetworkLoggerButton} from '@frogpond/navigation-buttons'

import {ServerRoute, useServerRoutes} from './query'
import {ChangeTextEvent} from '../../../../navigation/types'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const APITestView = (): React.JSX.Element => {
	let navigation = useNavigation()

	let [filterPath, setFilterPath] = React.useState<string>('')

	let {
		data: groupedRoutes = [],
		error: routesError,
		isLoading: isRoutesLoading,
		isError: isRoutesError,
		refetch: routesRefetch,
	} = useServerRoutes()

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
					{ setFilterPath(event.nativeEvent.text); },
				placeholder: '/path/to/uri',
			},
			headerRight: rightButton,
		})
	}, [navigation])

	let showSearchResult = React.useCallback(() => {
		navigation.navigate('APITestDetail', {
			query: {
				displayName: filterPath,
				path: filterPath,
				params: [],
			},
		})
	}, [filterPath, navigation])

	React.useEffect(() => {
		debounceSearch(filterPath, () => { showSearchResult(); })
	}, [filterPath, navigation, showSearchResult])

	const renderItem = React.useCallback(
		(item: ServerRoute) => (
			<SafeAreaView>
				<ListRow
					fullWidth={false}
					onPress={() => { navigation.navigate('APITestDetail', {query: item}); }}
					style={styles.serverRouteRow}
				>
					<Column flex={1}>
						<Title lines={1}>{item.displayName}</Title>
					</Column>
				</ListRow>
			</SafeAreaView>
		),
		[navigation],
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
