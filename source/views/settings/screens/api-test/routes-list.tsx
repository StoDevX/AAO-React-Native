import React from 'react'
import {View, SectionList, SafeAreaView, StyleSheet} from 'react-native'

import {ListRow, ListSectionHeader, ListSeparator, Title} from '@frogpond/lists'
import {Column} from '@frogpond/layout'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {useServerRoutes} from './query'

interface ServerRoutesListParams {
	setSearchPath: React.Dispatch<React.SetStateAction<string>>
}

export const ServerRoutesListView = (
	props: ServerRoutesListParams,
): JSX.Element => {
	let {
		data: groupedRoutes = [],
		error: routesError,
		isLoading: isRoutesLoading,
		isError: isRoutesError,
		refetch: routesRefetch,
	} = useServerRoutes()

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
					renderItem={({item}) => {
						return (
							<SafeAreaView>
								<ListRow
									fullWidth={false}
									onPress={() => props.setSearchPath(item.displayName)}
									style={styles.serverRouteRow}
								>
									<Column flex={1}>
										<Title lines={1}>{item.displayName}</Title>
									</Column>
								</ListRow>
							</SafeAreaView>
						)
					}}
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
