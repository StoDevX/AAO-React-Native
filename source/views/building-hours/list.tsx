import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {ListSectionHeader, ListSeparator} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useMomentTimer} from '@frogpond/timer'

import {useGroupedBuildings} from './query'
import {BuildingRow} from './row'
import {BuildingType} from './types'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
		flexGrow: 1,
	},
})

export function BuildingHoursView(): JSX.Element {
	let navigation = useNavigation()

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})

	let {
		data = [],
		error,
		refetch,
		isLoading,
		isError,
		isRefetching,
	} = useGroupedBuildings()

	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			navigation.navigate('BuildingHoursDetail', {building}),
		[navigation],
	)

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
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="No hours." />
			}
			contentContainerStyle={styles.container}
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<BuildingRow info={item} now={now} onPress={() => onPressRow(item)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={data}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Building Hours',
	headerBackTitle: 'Back',
}
