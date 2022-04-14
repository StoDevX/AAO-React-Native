import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from './row'

import type {Moment} from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import {useNavigation} from '@react-navigation/native'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		flexGrow: 1,
	},
})

type Props = TopLevelViewPropsType & {
	now: Moment
	loading: boolean
	onRefresh: () => any
	buildings: Array<{title: string; data: BuildingType[]}>
}

export function BuildingHoursList(props: Props) {
	let navigation = useNavigation()

	let onPressRow = React.useCallback(
		(data: BuildingType) =>
			navigation.navigate('BuildingHoursDetail', {
				building: data,
			}),
		[],
	)

	let keyExtractor = (item: BuildingType) => item.name

	let renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	let renderItem = ({item}: {item: BuildingType}) => (
		<BuildingRow
			info={item}
			name={item.name}
			now={props.now}
			onPress={onPressRow}
		/>
	)

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="No hours." />}
			contentContainerStyle={styles.container}
			extraData={props}
			keyExtractor={keyExtractor}
			onRefresh={props.onRefresh}
			refreshing={props.loading}
			renderItem={renderItem}
			renderSectionHeader={renderSectionHeader}
			sections={props.buildings}
		/>
	)
}
