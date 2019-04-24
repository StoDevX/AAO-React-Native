// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {Navigation} from 'react-native-navigation'
import {BuildingRow} from './row'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
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
		Navigation.push(this.props.componentId, {
			component: {
				name: 'app.hours.detail',
				passProps: {
					building: JSON.parse(JSON.stringify(data)),
				},
				options: {
					topBar: {
						title: {
							text: data.name,
						},
					},
				},
			},
		})
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
