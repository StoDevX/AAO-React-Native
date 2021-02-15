import * as React from 'react'
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

type Props = TopLevelViewPropsType

type State = {
	modes: Array<OtherModeType>
	loading: boolean
	refreshing: boolean
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
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	fetchData = async (reload?: boolean) => {
		let {data: modes}: {data: Array<OtherModeType>} = await fetch(
			transportationUrl,
			{
				delay: reload ? 500 : 0,
			},
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
		let groupedData = groupModes(this.state.modes)
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				contentContainerStyle={styles.contentContainer}
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
