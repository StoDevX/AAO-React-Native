import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from './row'
import {useGroupedBuildings} from './query'
import {BuildingType} from './types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader, emptyList} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {useMomentTimer} from '@frogpond/timer/hook'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		flexGrow: 1,
	},
})

export function BuildingHoursView(): JSX.Element {
	let navigation = useNavigation()

	let {status, data, error, refetch, isInitialLoading} = useGroupedBuildings()
	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})

	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			navigation.navigate('BuildingHoursDetail', {building}),
		[navigation],
	)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				status === 'loading' ? (
					<LoadingView />
				) : status === 'error' ? (
					<NoticeView text={String(error)} />
				) : (
					<NoticeView text="No hours." />
				)
			}
			contentContainerStyle={styles.container}
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={status === 'loading' && !isInitialLoading}
			renderItem={({item}) => (
				<BuildingRow info={item} now={now} onPress={() => onPressRow(item)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={data || emptyList}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Building Hours',
	headerBackTitle: 'Back',
}
