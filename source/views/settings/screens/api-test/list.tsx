import React from 'react'
import {View, SectionList, StyleSheet} from 'react-native'
import {ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {ServerRoute, serverRoutesOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'

export const APITestView = (): React.ReactNode => {
	let router = useRouter()

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
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction
						onPress={() => router.navigate('/NetworkLogger')}
					>
						Network Logger
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<Stack.SearchBar
				autoCapitalize="none"
				onSearchButtonPress={(ev) => {
					let filterPath = ev.nativeEvent.text
					router.push({
						pathname: '/APITestDetail',
						params: {displayName: filterPath},
					})
				}}
				placeholder="/path/to/uri"
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
						renderSectionHeader={({section: {title}}) => (
							<ListSectionHeader title={title} />
						)}
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
