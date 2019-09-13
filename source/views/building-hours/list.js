// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from './row'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		flexGrow: 1,
	},
})

type Props = TopLevelViewPropsType & {
	now: momentT,
	loading: boolean,
	onRefresh: () => any,
	buildings: Array<{title: string, data: BuildingType[]}>,
}

export class BuildingHoursList extends React.PureComponent<Props> {
	onPressRow = (data: BuildingType) => {
		this.props.navigation.navigate('BuildingHoursDetailView', {building: data})
	}

	keyExtractor = (item: BuildingType) => item.name

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: BuildingType}) => (
		<BuildingRow
			info={item}
			name={item.name}
			now={this.props.now}
			onPress={this.onPressRow}
		/>
	)

	render() {
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No hours." />}
				contentContainerStyle={styles.container}
				extraData={this.props}
				keyExtractor={this.keyExtractor}
				onRefresh={this.props.onRefresh}
				refreshing={this.props.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={(this.props.buildings: any)}
			/>
		)
	}
}
