import * as React from 'react'
import {OtherModesRow} from './row'
import * as defaultData from '../../../../docs/transportation.json'
import * as c from '@frogpond/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListEmpty, ListSectionHeader, ListSeparator} from '@frogpond/lists'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {OtherModeType} from '../types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {useNavigation} from '@react-navigation/native'
import {openUrl} from '@frogpond/open-url'

const transportationUrl = API('/transit/modes')

const groupModes = (modes: OtherModeType[]) => {
	let grouped = groupBy(modes, (m) => m.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

let OtherModesView = (): JSX.Element => {
	let [modes, setModes] = React.useState<OtherModeType[]>(defaultData.data)
	let [refreshing, setRefreshing] = React.useState(false)

	let navigation = useNavigation()

	let fetchData = React.useCallback(async (reload?: boolean): Promise<void> => {
		let {data: modes}: {data: Array<OtherModeType>} = await fetch(
			transportationUrl,
			{delay: reload ? 500 : 0},
		).json()

		setModes(modes)
	}, [])

	React.useEffect(() => {
		fetchData()
	}, [fetchData])

	let refresh = async (): Promise<void> => {
		setRefreshing(true)
		await fetchData(true)
		setRefreshing(false)
	}

	let groupedData = groupModes(modes)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<ListEmpty mode="bug" />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item) => item.name}
			onRefresh={refresh}
			refreshing={refreshing}
			renderItem={({item}) => (
				<OtherModesRow mode={item} onPress={(mode) => openUrl(mode.url)} />
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={groupedData}
			style={styles.listContainer}
		/>
	)
}

export {OtherModesView as View}
