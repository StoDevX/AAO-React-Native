import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from '../../../source/features/building-hours/row'
import {useGroupedBuildings} from '../../../source/features/building-hours/query'
import {BuildingType} from '../../../source/features/building-hours/types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
		flexGrow: 1,
	},
})

function BuildingHoursView(): React.ReactNode {
	let router = useRouter()

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})

	let {data = [], error, refetch, isLoading, isError, isRefetching} = useGroupedBuildings()

	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/BuildingHours/[name]',
				params: {name: building.name},
			}),
		[router],
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
			ListEmptyComponent={isLoading ? <LoadingView /> : <NoticeView text="No hours." />}
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item) => item.name}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<BuildingRow info={item} now={now} onPress={() => onPressRow(item)} />
			)}
			renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
			sections={data}
		/>
	)
}

export default function BuildingHoursPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Building Hours</Stack.Title>
			<BuildingHoursView />
		</>
	)
}
