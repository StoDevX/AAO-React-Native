// @flow
import * as React from 'react'
import delay from 'delay'
import {OtherModesRow} from './row'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import * as defaultData from '../../../../docs/transportation.json'
import * as c from '@frogpond/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader, ListEmpty} from '@frogpond/lists'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {TopLevelViewPropsType} from '../../types'
import type {OtherModeType} from '../types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const transportationUrl = API('/transit/modes')

const groupModes = (modes: OtherModeType[]) => {
	const grouped = groupBy(modes, m => m.category)
	return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType

type State = {
	modes: Array<OtherModeType>,
	loading: boolean,
	refreshing: boolean,
}

export class OtherModesView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Other Modes',
		tabBarIcon: TabBarIcon('boat'),
	}

	state = {
		modes: defaultData.data,
		loading: true,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	refresh = async (): any => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	fetchData = async () => {
		let {data: modes}: {data: Array<OtherModeType>} = await fetch(
			transportationUrl,
		).json()
		this.setState(() => ({modes}))
	}

	onPress = (mode: OtherModeType) => {
		this.props.navigation.navigate('OtherModesDetailView', {
			mode,
		})
	}

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: OtherModeType}) => (
		<OtherModesRow mode={item} onPress={this.onPress} />
	)

	keyExtractor = (item: OtherModeType) => item.name

	render() {
		const groupedData = groupModes(this.state.modes)
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={groupedData}
				style={styles.listContainer}
			/>
		)
	}
}
