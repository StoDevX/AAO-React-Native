import * as React from 'react'
import {View, SectionList, StyleSheet} from 'react-native'
import {ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {useQuery} from '@tanstack/react-query'
import {Stack, useNavigation, useRouter} from 'expo-router'

import {SearchBar} from '../../source/components/search-bar'
import {
	ServerRoute,
	serverRoutesOptions,
} from '../../source/features/settings/screens/api-test/query'

export default function APITestPage(): React.ReactNode {
	const navigation = useNavigation()
	let router = useRouter()

	// The path is only read when the reader hits Search, but it has to be held
	// here as well: the search field is the one place it lives otherwise, and a
	// swipe back that is begun and abandoned empties it.
	let [path, setPath] = React.useState('')

	let {
		data: groupedRoutes = [],
		error: routesError,
		isLoading: isRoutesLoading,
		isError: isRoutesError,
		refetch: routesRefetch,
	} = useQuery(serverRoutesOptions)

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
		<>
			<Stack.Title>API Tester</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Menu icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction onPress={() => router.navigate('/NetworkLogger')}>
						Network Logger
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar
				autoCapitalize="none"
				onChangeText={setPath}
				onSearchButtonPress={(ev) => {
					router.push({
						pathname: '/APITestDetail',
						params: {displayName: ev.nativeEvent.text},
					})
				}}
				placeholder="/path/to/uri"
				value={path}
			/>

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
						renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
						sections={groupedRoutes}
					/>
				)}
			</View>
		</>
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
