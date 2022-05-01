import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from './row'

import {useFetch} from 'react-async'
import {BuildingType} from './types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'
import {API} from '@frogpond/api'
import {useSelector} from 'react-redux'
import groupBy from 'lodash/groupBy'
import {ReduxState} from '../../redux'
import {useMomentTimer} from '@frogpond/timer/hook'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		flexGrow: 1,
	},
})

function useBuildingHours() {
	return useFetch<BuildingType[]>(API('/spaces/hours'), {
		headers: {accept: 'application/json'},
	})
}

const emptyList: ReadonlyArray<never> = []

function groupBuildings(
	buildings: Array<BuildingType> | void,
	favorites: Array<string>,
) {
	if (!buildings) {
		return emptyList
	}

	let favoritesGroup = {
		title: 'Favorites',
		data: buildings.filter((b) => favorites.includes(b.name)),
	}

	let grouped = groupBy(buildings, (b) => b.category || 'Other')
	let groupedBuildings = Object.entries(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	if (favoritesGroup.data.length > 0) {
		groupedBuildings = [favoritesGroup, ...groupedBuildings]
	}

	return groupedBuildings
}

export function BuildingHoursView(): JSX.Element {
	let navigation = useNavigation()

	let {data: buildings, isPending, isInitial, reload} = useBuildingHours()
	let favoriteBuildings = useSelector(
		(state: ReduxState) => state.buildings?.favorites ?? [],
	)

	let grouped = React.useMemo(
		() => groupBuildings(buildings, favoriteBuildings),
		[buildings, favoriteBuildings],
	)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute'})

	let onPressRow = React.useCallback(
		(building: BuildingType) =>
			navigation.navigate('BuildingHoursDetail', {building}),
		[navigation],
	)

	if (isInitial) {
		return <LoadingView />
	}

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="No hours." />}
			contentContainerStyle={styles.container}
			keyExtractor={(item) => item.name}
			onRefresh={reload}
			refreshing={isPending && !isInitial}
			renderItem={({item}) => (
				<BuildingRow info={item} now={now} onPress={() => onPressRow(item)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={grouped}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Building Hours',
	headerBackTitle: 'Back',
}
